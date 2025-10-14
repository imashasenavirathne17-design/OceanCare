const ComplianceFramework = require('../models/ComplianceFramework');

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const buildFilter = (q = {}) => {
  const { term, status, code } = q;
  const filter = {};
  if (term) filter.$text = { $search: term };
  if (status && status !== 'all') filter.status = status;
  if (code) filter.code = code.toUpperCase();
  return filter;
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'name' } = req.query;
    const filter = buildFilter(req.query);
    const skip = (toInt(page, 1) - 1) * toInt(limit, 20);

    const [items, total] = await Promise.all([
      ComplianceFramework.find(filter).sort(sort).skip(skip).limit(toInt(limit, 20)).lean(),
      ComplianceFramework.countDocuments(filter),
    ]);

    return res.json({
      frameworks: items,
      pagination: {
        page: toInt(page, 1),
        limit: toInt(limit, 20),
        total,
        pages: Math.ceil(total / toInt(limit, 20)),
      },
    });
  } catch (err) {
    console.error('List frameworks error:', err);
    return res.status(500).json({ message: 'Failed to fetch compliance frameworks' });
  }
};

exports.get = async (req, res) => {
  try {
    const item = await ComplianceFramework.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Compliance framework not found' });
    return res.json(item);
  } catch (err) {
    console.error('Get framework error:', err);
    return res.status(500).json({ message: 'Failed to fetch compliance framework' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code } = req.body || {};
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });
    const payload = {
      ...req.body,
      code: String(req.body.code).toUpperCase(),
      lastAuditAt: req.body.lastAuditAt ? new Date(req.body.lastAuditAt) : undefined,
      createdBy: req.user?.id || null,
      createdByName: req.user?.fullName || 'Administrator',
    };
    const item = await ComplianceFramework.create(payload);
    return res.status(201).json(item.toObject());
  } catch (err) {
    console.error('Create framework error:', err);
    const message = err.code === 11000 ? 'Code must be unique' : (err?.message || 'Failed to create framework');
    return res.status(500).json({ message });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.code) updates.code = String(updates.code).toUpperCase();
    if (updates.lastAuditAt) updates.lastAuditAt = new Date(updates.lastAuditAt);
    updates.updatedBy = req.user?.id || null;
    updates.updatedByName = req.user?.fullName || 'Administrator';

    const item = await ComplianceFramework.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Compliance framework not found' });
    return res.json(item);
  } catch (err) {
    console.error('Update framework error:', err);
    return res.status(500).json({ message: 'Failed to update framework' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await ComplianceFramework.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Compliance framework not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete framework error:', err);
    return res.status(500).json({ message: 'Failed to delete framework' });
  }
};
