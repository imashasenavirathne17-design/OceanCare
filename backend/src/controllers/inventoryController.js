const InventoryItem = require('../models/InventoryItem');
const { logAuditEvent } = require('../utils/auditLogger');

// Helper to compute status
function computeStatus(item) {
  const qty = item.qty || 0;
  const min = item.min || 0;
  const days = item.expiry ? Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24)) : Infinity;
  if (qty < min) return 'Low Stock';
  if (days <= 30) return 'Expiring Soon';
  return 'Adequate';
}

exports.createItem = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user && req.user.id };
    const item = await InventoryItem.create(data);
    await logAuditEvent({
      resource: 'inventory',
      action: 'create',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Created inventory item ${item.name || item._id}`,
      metadata: { itemId: item._id, payload: data },
    });
    return res.status(201).json(item);
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory',
      action: 'create',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to create inventory item: ${err.message}`,
      metadata: { payload: req.body },
    });
    return res.status(400).json({ message: 'Failed to create item', error: err.message });
  }
};

exports.getItems = async (req, res) => {
  try {
    const { category, zone, status, search, page = 1, limit = 20 } = req.query;

    const q = {};
    if (category && category !== 'All Categories') q.category = new RegExp(category.split(' ')[0], 'i');
    if (zone && zone !== 'All Zones') q.zone = new RegExp(zone, 'i');
    if (search) q.name = new RegExp(search, 'i');

    const skip = (Number(page) - 1) * Number(limit);

    // Fetch base list
    const [items, total] = await Promise.all([
      InventoryItem.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      InventoryItem.countDocuments(q),
    ]);

    // In-memory status filtering if provided
    let filtered = items;
    if (status && status !== 'All Statuses') {
      filtered = items.filter((it) => computeStatus(it) === status);
    }

    // Map with computed status meta (optional for client convenience)
    const data = filtered.map((it) => ({
      ...it.toObject(),
      _status: computeStatus(it),
      _pctOfMin: it.min ? Math.round(Math.min(100, (it.qty / it.min) * 100)) : 0,
    }));

    return res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      count: data.length,
      items: data,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch items', error: err.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    return res.json(item);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to fetch item', error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const existing = await InventoryItem.findById(req.params.id);
    if (!existing) {
      await logAuditEvent({
        resource: 'inventory',
        action: 'update',
        status: 'failure',
        userId: req.user?.id,
        userName: req.user?.fullName,
        details: `Attempted to update missing item ${req.params.id}`,
        metadata: { payload: req.body },
      });
      return res.status(404).json({ message: 'Item not found' });
    }

    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    await logAuditEvent({
      resource: 'inventory',
      action: 'update',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Updated inventory item ${item.name || item._id}`,
      metadata: { itemId: item._id, before: existing.toObject(), updates: req.body },
    });

    return res.json(item);
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory',
      action: 'update',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to update item ${req.params.id}: ${err.message}`,
      metadata: { payload: req.body },
    });
    return res.status(400).json({ message: 'Failed to update item', error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const existing = await InventoryItem.findById(req.params.id);
    if (!existing) {
      await logAuditEvent({
        resource: 'inventory',
        action: 'delete',
        status: 'failure',
        userId: req.user?.id,
        userName: req.user?.fullName,
        details: `Attempted to delete missing item ${req.params.id}`,
      });
      return res.status(404).json({ message: 'Item not found' });
    }

    await InventoryItem.findByIdAndDelete(req.params.id);

    await logAuditEvent({
      resource: 'inventory',
      action: 'delete',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Deleted inventory item ${existing.name || existing._id}`,
      metadata: { itemId: existing._id, before: existing.toObject() },
    });

    return res.json({ message: 'Item deleted' });
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory',
      action: 'delete',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to delete item ${req.params.id}: ${err.message}`,
    });
    return res.status(400).json({ message: 'Failed to delete item', error: err.message });
  }
};
