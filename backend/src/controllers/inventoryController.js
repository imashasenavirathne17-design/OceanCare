const InventoryItem = require('../models/InventoryItem');

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
    return res.status(201).json(item);
  } catch (err) {
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
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    return res.json(item);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update item', error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    return res.json({ message: 'Item deleted' });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to delete item', error: err.message });
  }
};
