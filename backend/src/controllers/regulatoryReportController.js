const RegulatoryReport = require('../models/RegulatoryReport');

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const buildFilter = (q = {}) => {
  const { term, status, agency, frequency } = q;
  const filter = {};
  if (term) filter.$text = { $search: term };
  if (status && status !== 'all') filter.status = status;
  if (agency) filter.agency = agency;
  if (frequency && frequency !== 'all') filter.frequency = frequency;
  return filter;
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-dueDate' } = req.query;
    const filter = buildFilter(req.query);
    const skip = (toInt(page, 1) - 1) * toInt(limit, 20);

    const [items, total] = await Promise.all([
      RegulatoryReport.find(filter).sort(sort).skip(skip).limit(toInt(limit, 20)).lean(),
      RegulatoryReport.countDocuments(filter),
    ]);

    return res.json({
      reports: items,
      pagination: {
        page: toInt(page, 1),
        limit: toInt(limit, 20),
        total,
        pages: Math.ceil(total / toInt(limit, 20)),
      },
    });
  } catch (err) {
    console.error('List regulatory reports error:', err);
    return res.status(500).json({ message: 'Failed to fetch regulatory reports' });
  }
};

exports.get = async (req, res) => {
  try {
    const item = await RegulatoryReport.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Regulatory report not found' });
    return res.json(item);
  } catch (err) {
    console.error('Get regulatory report error:', err);
    return res.status(500).json({ message: 'Failed to fetch regulatory report' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, agency } = req.body || {};
    if (!title || !agency) return res.status(400).json({ message: 'Title and agency are required' });
    const payload = {
      ...req.body,
      dueDate: req.body?.dueDate ? new Date(req.body.dueDate) : undefined,
      lastRunAt: req.body?.lastRunAt ? new Date(req.body.lastRunAt) : undefined,
      createdBy: req.user?.id || null,
      createdByName: req.user?.fullName || 'Administrator',
    };
    const item = await RegulatoryReport.create(payload);
    return res.status(201).json(item.toObject());
  } catch (err) {
    console.error('Create regulatory report error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to create regulatory report' });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);
    if (updates.lastRunAt) updates.lastRunAt = new Date(updates.lastRunAt);
    updates.updatedBy = req.user?.id || null;
    updates.updatedByName = req.user?.fullName || 'Administrator';

    const item = await RegulatoryReport.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Regulatory report not found' });
    return res.json(item);
  } catch (err) {
    console.error('Update regulatory report error:', err);
    return res.status(500).json({ message: 'Failed to update regulatory report' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await RegulatoryReport.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Regulatory report not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete regulatory report error:', err);
    return res.status(500).json({ message: 'Failed to delete regulatory report' });
  }
};
