const EmergencyProtocol = require('../models/EmergencyProtocol');

// List with optional filters q, category, status
exports.list = async (req, res) => {
  try {
    const { q, category, status } = req.query;
    const filter = {};
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ];
    if (category) filter.category = category;
    if (status) filter.status = status;

    const items = await EmergencyProtocol.find(filter).sort({ updatedAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Failed to list protocols' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await EmergencyProtocol.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch protocol' });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {
      title: body.title,
      category: body.category || 'General',
      description: body.description || '',
      steps: Array.isArray(body.steps) ? body.steps : [],
      status: body.status || 'ACTIVE',
      tags: Array.isArray(body.tags) ? body.tags : [],
      lastReviewedAt: body.lastReviewedAt ? new Date(body.lastReviewedAt) : undefined,
      createdBy: req.user?.fullName || req.user?.email || 'system',
      updatedBy: req.user?.fullName || req.user?.email || 'system',
    };
    const created = await EmergencyProtocol.create(payload);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ message: 'Create failed' });
  }
};

exports.update = async (req, res) => {
  try {
    const body = req.body || {};
    const update = { ...body, updatedBy: req.user?.fullName || req.user?.email || 'system' };
    if (body.lastReviewedAt) update.lastReviewedAt = new Date(body.lastReviewedAt);
    const saved = await EmergencyProtocol.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!saved) return res.status(404).json({ message: 'Not found' });
    res.json(saved);
  } catch (e) {
    res.status(400).json({ message: 'Update failed' });
  }
};

exports.remove = async (req, res) => {
  try {
    const out = await EmergencyProtocol.findByIdAndDelete(req.params.id);
    if (!out) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: 'Delete failed' });
  }
};
