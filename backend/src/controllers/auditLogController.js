const AuditLog = require('../models/AuditLog');

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const buildFilter = (q) => {
  const { term, action, status, userId, resource, from, to } = q || {};
  const filter = {};
  if (term) filter.$text = { $search: term };
  if (action && action !== 'all') filter.action = action;
  if (status && status !== 'all') filter.status = status;
  if (userId) filter.userId = userId;
  if (resource) filter.resource = resource;
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }
  return filter;
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-timestamp' } = req.query;
    const filter = buildFilter(req.query);
    const skip = (toInt(page, 1) - 1) * toInt(limit, 20);

    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort(sort).skip(skip).limit(toInt(limit, 20)).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({
      logs: items,
      pagination: {
        page: toInt(page, 1),
        limit: toInt(limit, 20),
        total,
        pages: Math.ceil(total / toInt(limit, 20)),
      },
    });
  } catch (err) {
    console.error('List audit logs error:', err);
    return res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

exports.get = async (req, res) => {
  try {
    const item = await AuditLog.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Audit log not found' });
    return res.json(item);
  } catch (err) {
    console.error('Get audit log error:', err);
    return res.status(500).json({ message: 'Failed to fetch audit log' });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body?.resource) return res.status(400).json({ message: 'Resource is required' });
    const payload = {
      ...req.body,
      userId: req.user?.id || null,
      userName: req.user?.fullName || req.body?.userName || 'System',
      timestamp: req.body?.timestamp ? new Date(req.body.timestamp) : new Date(),
    };
    const item = await AuditLog.create(payload);
    return res.status(201).json(item.toObject());
  } catch (err) {
    console.error('Create audit log error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to create audit log' });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = {
      ...req.body,
    };
    const item = await AuditLog.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Audit log not found' });
    return res.json(item);
  } catch (err) {
    console.error('Update audit log error:', err);
    return res.status(500).json({ message: 'Failed to update audit log' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await AuditLog.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Audit log not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete audit log error:', err);
    return res.status(500).json({ message: 'Failed to delete audit log' });
  }
};
