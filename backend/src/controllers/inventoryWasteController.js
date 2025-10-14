const InventoryWasteRecord = require('../models/InventoryWasteRecord');
const { logAuditEvent } = require('../utils/auditLogger');

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildFilters = (query = {}) => {
  const filter = {};
  if (query.type && query.type !== 'all') filter.disposalType = query.type;
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.method && query.method !== 'all') filter.method = query.method;
  if (query.term) {
    const regex = new RegExp(query.term, 'i');
    filter.$or = [
      { itemName: regex },
      { reason: regex },
      { notes: regex },
      { location: regex },
      { reporter: regex },
    ];
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const toDate = new Date(query.to);
      toDate.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }
  return filter;
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = buildFilters(req.query);
    const skip = (toInt(page, 1) - 1) * toInt(limit, 10);

    const [records, total] = await Promise.all([
      InventoryWasteRecord.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(toInt(limit, 10))
        .lean(),
      InventoryWasteRecord.countDocuments(filter),
    ]);

    return res.json({
      records,
      pagination: {
        page: toInt(page, 1),
        limit: toInt(limit, 10),
        total,
        pages: Math.ceil(total / toInt(limit, 10)) || 1,
      },
    });
  } catch (err) {
    console.error('List inventory waste error:', err);
    return res.status(500).json({ message: 'Failed to fetch waste disposal records' });
  }
};

exports.get = async (req, res) => {
  try {
    const record = await InventoryWasteRecord.findById(req.params.id).lean();
    if (!record) return res.status(404).json({ message: 'Waste disposal record not found' });
    return res.json(record);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to fetch record', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user?.id,
      reporter: req.body.reporter || req.user?.fullName || 'Inventory User',
    };
    const record = await InventoryWasteRecord.create(payload);

    await logAuditEvent({
      resource: 'inventory-waste',
      action: 'create',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Created waste disposal record for ${record.itemName}`,
      metadata: { recordId: record._id, payload },
    });

    return res.status(201).json(record.toObject());
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory-waste',
      action: 'create',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to create waste disposal record: ${err.message}`,
      metadata: { payload: req.body },
    });
    return res.status(400).json({ message: 'Failed to create record', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await InventoryWasteRecord.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Waste disposal record not found' });

    const updates = { ...req.body };
    if (updates.status === 'completed' && !existing.disposalDate) {
      updates.disposalDate = new Date();
      updates.processedBy = req.user?.id;
    }

    const record = await InventoryWasteRecord.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    await logAuditEvent({
      resource: 'inventory-waste',
      action: 'update',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Updated waste disposal record ${record.itemName}`,
      metadata: { recordId: record._id, before: existing.toObject(), updates },
    });

    return res.json(record.toObject());
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory-waste',
      action: 'update',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to update waste disposal record: ${err.message}`,
      metadata: { payload: req.body },
    });
    return res.status(400).json({ message: 'Failed to update record', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const existing = await InventoryWasteRecord.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Waste disposal record not found' });

    await InventoryWasteRecord.findByIdAndDelete(req.params.id);

    await logAuditEvent({
      resource: 'inventory-waste',
      action: 'delete',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Deleted waste disposal record ${existing.itemName}`,
      metadata: { recordId: existing._id },
    });

    return res.json({ message: 'Waste disposal record deleted' });
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory-waste',
      action: 'delete',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to delete waste disposal record: ${err.message}`,
    });
    return res.status(400).json({ message: 'Failed to delete record', error: err.message });
  }
};
