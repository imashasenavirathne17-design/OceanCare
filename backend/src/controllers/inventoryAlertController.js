const mongoose = require('mongoose');
const InventoryAlert = require('../models/InventoryAlert');
const InventoryItem = require('../models/InventoryItem');

const { Types } = mongoose;
const VALID_METHODS = ['system', 'email', 'sms'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUS = ['draft', 'sent', 'acknowledged', 'resolved'];

const toObjectId = (value) => {
  if (!value) return null;
  try {
    return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
  } catch (err) {
    return null;
  }
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sanitizeMethods = (value) => {
  if (Array.isArray(value)) {
    const unique = [...new Set(value.map((v) => String(v).toLowerCase()))];
    const filtered = unique.filter((m) => VALID_METHODS.includes(m));
    return filtered.length ? filtered : ['system'];
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return VALID_METHODS.includes(lower) ? [lower] : ['system'];
  }
  return ['system'];
};

const sanitizePriority = (value, fallback = 'medium') => {
  if (!value) return fallback;
  const lower = String(value).toLowerCase();
  return VALID_PRIORITIES.includes(lower) ? lower : fallback;
};

const sanitizeStatus = (value, fallback = 'sent') => {
  if (!value) return fallback;
  const lower = String(value).toLowerCase();
  return VALID_STATUS.includes(lower) ? lower : fallback;
};

const buildFilter = (query = {}) => {
  const filter = {};
  const { q, status, priority, recipient, itemId, from, to, createdBy } = query;

  if (q) {
    const regex = { $regex: q, $options: 'i' };
    filter.$or = [
      { itemName: regex },
      { category: regex },
      { message: regex },
      { recipient: regex },
      { notes: regex },
    ];
  }

  if (status && status !== 'all') {
    const normalizedStatus = sanitizeStatus(status, null);
    if (normalizedStatus) filter.status = normalizedStatus;
  }

  if (priority && priority !== 'all') {
    const normalizedPriority = sanitizePriority(priority, null);
    if (normalizedPriority) filter.priority = normalizedPriority;
  }

  if (recipient && recipient !== 'all') {
    filter.recipient = recipient;
  }

  const itemObjectId = toObjectId(itemId);
  if (itemObjectId) filter.itemId = itemObjectId;

  const createdById = toObjectId(createdBy);
  if (createdById) filter.createdBy = createdById;

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = fromDate;
    if (toDate) filter.createdAt.$lte = toDate;
    if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
  }

  return filter;
};

exports.listAlerts = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = limitParam && limitParam > 0 ? Math.min(limitParam, 100) : 50;
    const skip = (page - 1) * limit;

    const matchFilter = Object.keys(filter).length ? filter : {};

    const [items, total, statusStats, priorityStats, priorityStatusStats, recent] = await Promise.all([
      InventoryAlert.find(matchFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      InventoryAlert.countDocuments(matchFilter),
      InventoryAlert.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      InventoryAlert.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      InventoryAlert.aggregate([
        { $match: matchFilter },
        { $group: { _id: { priority: '$priority', status: '$status' }, count: { $sum: 1 } } },
      ]),
      InventoryAlert.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const statusBreakdown = { draft: 0, sent: 0, acknowledged: 0, resolved: 0 };
    statusStats.forEach((entry) => {
      if (entry?._id && typeof entry.count === 'number') {
        statusBreakdown[entry._id] = entry.count;
      }
    });

    const priorityBreakdown = { low: 0, medium: 0, high: 0 };
    priorityStats.forEach((entry) => {
      if (entry?._id && typeof entry.count === 'number') {
        priorityBreakdown[entry._id] = entry.count;
      }
    });

    let highPriorityOpen = 0;
    priorityStatusStats.forEach((entry) => {
      const priorityValue = entry?._id?.priority;
      const statusValue = entry?._id?.status;
      if (priorityValue === 'high' && ['sent', 'acknowledged'].includes(statusValue)) {
        highPriorityOpen += entry.count || 0;
      }
    });

    const unresolved = (statusBreakdown.sent || 0) + (statusBreakdown.acknowledged || 0);
    const resolved = statusBreakdown.resolved || 0;
    const pages = total ? Math.ceil(total / limit) : 0;

    return res.json({
      items,
      total,
      page,
      pages,
      summary: {
        total,
        unresolved,
        resolved,
        highPriorityOpen,
        statusBreakdown,
        priorityBreakdown,
      },
      recent,
    });
  } catch (error) {
    console.error('List inventory alerts error:', error);
    return res.status(500).json({ message: 'Failed to list inventory alerts' });
  }
};

exports.getAlert = async (req, res) => {
  try {
    const alert = await InventoryAlert.findById(req.params.id).lean();
    if (!alert) {
      return res.status(404).json({ message: 'Inventory alert not found' });
    }
    return res.json(alert);
  } catch (error) {
    console.error('Get inventory alert error:', error);
    return res.status(500).json({ message: 'Failed to get inventory alert' });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const {
      itemId,
      itemName,
      category,
      currentStock,
      minimumRequired,
      priority,
      message,
      recipient,
      deliveryMethods,
      status,
      notes,
    } = req.body;

    if (!itemName && !itemId) {
      return res.status(400).json({ message: 'Item name is required' });
    }
    if (!message) {
      return res.status(400).json({ message: 'Alert message is required' });
    }

    let resolvedItemName = itemName;
    let resolvedCategory = category;
    const itemObjectId = toObjectId(itemId);

    if (!resolvedItemName && itemObjectId) {
      const existingItem = await InventoryItem.findById(itemObjectId).lean();
      if (existingItem) {
        resolvedItemName = existingItem.name;
        resolvedCategory = resolvedCategory || existingItem.category;
      }
    }

    const normalizedPriority = sanitizePriority(priority, 'medium');
    const normalizedStatus = sanitizeStatus(status, 'sent');
    const methods = sanitizeMethods(deliveryMethods);
    const now = new Date();

    const alert = await InventoryAlert.create({
      itemId: itemObjectId || undefined,
      itemName: resolvedItemName,
      category: resolvedCategory,
      currentStock: currentStock !== undefined ? Number(currentStock) : undefined,
      minimumRequired: minimumRequired !== undefined ? Number(minimumRequired) : undefined,
      priority: normalizedPriority,
      message,
      recipient: recipient || 'inventory-manager',
      deliveryMethods: methods,
      status: normalizedStatus,
      sentAt: normalizedStatus === 'sent' ? now : undefined,
      acknowledgedAt: normalizedStatus === 'acknowledged' ? now : undefined,
      resolvedAt: normalizedStatus === 'resolved' ? now : undefined,
      notes,
      createdBy: req.user?.id || null,
      createdByName: req.user?.fullName || req.user?.name || 'Health Officer',
      updatedBy: req.user?.id || null,
      updatedByName: req.user?.fullName || req.user?.name || 'Health Officer',
    });

    return res.status(201).json(alert);
  } catch (error) {
    console.error('Create inventory alert error:', error);
    return res.status(500).json({ message: 'Failed to create inventory alert' });
  }
};

exports.updateAlert = async (req, res) => {
  try {
    const alert = await InventoryAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Inventory alert not found' });
    }

    const {
      itemId,
      itemName,
      category,
      currentStock,
      minimumRequired,
      priority,
      message,
      recipient,
      deliveryMethods,
      status,
      notes,
    } = req.body;

    if (itemId !== undefined) {
      const itemObjectId = toObjectId(itemId);
      alert.itemId = itemObjectId || undefined;
      if (!itemName && itemObjectId) {
        const existingItem = await InventoryItem.findById(itemObjectId).lean();
        if (existingItem) {
          alert.itemName = existingItem.name;
          alert.category = existingItem.category;
        }
      }
    }

    if (itemName !== undefined) alert.itemName = itemName;
    if (category !== undefined) alert.category = category;
    if (message !== undefined) alert.message = message;
    if (recipient !== undefined) alert.recipient = recipient;
    if (notes !== undefined) alert.notes = notes;

    if (currentStock !== undefined) {
      const numeric = Number(currentStock);
      alert.currentStock = Number.isNaN(numeric) ? alert.currentStock : numeric;
    }

    if (minimumRequired !== undefined) {
      const numeric = Number(minimumRequired);
      alert.minimumRequired = Number.isNaN(numeric) ? alert.minimumRequired : numeric;
    }

    if (priority !== undefined) {
      alert.priority = sanitizePriority(priority, alert.priority || 'medium');
    }

    if (deliveryMethods !== undefined) {
      alert.deliveryMethods = sanitizeMethods(deliveryMethods);
    }

    if (status !== undefined) {
      const normalizedStatus = sanitizeStatus(status, alert.status);
      if (normalizedStatus !== alert.status) {
        const now = new Date();
        if (normalizedStatus === 'sent' && !alert.sentAt) alert.sentAt = now;
        if (normalizedStatus === 'acknowledged') alert.acknowledgedAt = now;
        if (normalizedStatus === 'resolved') alert.resolvedAt = now;
      }
      alert.status = normalizedStatus;
    }

    alert.updatedBy = req.user?.id || null;
    alert.updatedByName = req.user?.fullName || req.user?.name || 'Health Officer';

    await alert.save();

    return res.json(alert);
  } catch (error) {
    console.error('Update inventory alert error:', error);
    return res.status(500).json({ message: 'Failed to update inventory alert' });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const alert = await InventoryAlert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Inventory alert not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete inventory alert error:', error);
    return res.status(500).json({ message: 'Failed to delete inventory alert' });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await InventoryAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Inventory alert not found' });
    }

    const now = new Date();
    alert.status = 'acknowledged';
    alert.acknowledgedAt = now;
    alert.updatedBy = req.user?.id || null;
    alert.updatedByName = req.user?.fullName || req.user?.name || 'Health Officer';

    await alert.save();
    return res.json(alert);
  } catch (error) {
    console.error('Acknowledge inventory alert error:', error);
    return res.status(500).json({ message: 'Failed to acknowledge inventory alert' });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await InventoryAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Inventory alert not found' });
    }

    const now = new Date();
    alert.status = 'resolved';
    alert.resolvedAt = now;
    if (!alert.acknowledgedAt) alert.acknowledgedAt = now;
    alert.updatedBy = req.user?.id || null;
    alert.updatedByName = req.user?.fullName || req.user?.name || 'Health Officer';

    await alert.save();
    return res.json(alert);
  } catch (error) {
    console.error('Resolve inventory alert error:', error);
    return res.status(500).json({ message: 'Failed to resolve inventory alert' });
  }
};
