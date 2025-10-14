const EmergencyReport = require('../models/EmergencyReport');

const normalizeStatus = (value) => {
  if (!value) return undefined;
  return value.toUpperCase().replace(/[-\s]/g, '_');
};

const normalizePriority = (value) => {
  if (!value) return undefined;
  return value.toUpperCase();
};

const toDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null && item !== '');
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
  }
  if (value !== undefined && value !== null && value !== '') return [value];
  return [];
};

const buildFilters = (query = {}) => {
  const filter = {};
  if (query.status && query.status !== 'ALL') filter.status = normalizeStatus(query.status);
  if (query.priority && query.priority !== 'ALL') filter.priority = normalizePriority(query.priority);
  if (query.reportType && query.reportType !== 'all') filter.reportType = query.reportType;
  if (query.category && query.category !== 'all') filter.category = query.category;
  if (query.q) filter.$text = { $search: query.q };
  if (query.startDate || query.endDate) {
    filter.generatedAt = {};
    if (query.startDate) filter.generatedAt.$gte = toDate(query.startDate);
    if (query.endDate) filter.generatedAt.$lte = toDate(query.endDate);
  }
  return filter;
};

exports.list = async (req, res) => {
  try {
    const filter = buildFilters(req.query || {});
    const items = await EmergencyReport.find(filter)
      .sort({ generatedAt: -1, createdAt: -1 })
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list emergency reports' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const doc = await EmergencyReport.findById(req.params.id).populate('incidents').lean();
    if (!doc) return res.status(404).json({ message: 'Report not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch emergency report' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.reportCode || !payload.title) {
      return res.status(400).json({ message: 'reportCode and title are required' });
    }

    const doc = await EmergencyReport.create({
      ...payload,
      status: normalizeStatus(payload.status) || 'DRAFT',
      priority: normalizePriority(payload.priority) || 'MEDIUM',
      generatedAt: payload.generatedAt ? toDate(payload.generatedAt) : new Date(),
      timeframe: {
        start: toDate(payload?.timeframe?.start || payload.timeframeStart),
        end: toDate(payload?.timeframe?.end || payload.timeframeEnd),
      },
      tags: toArray(payload.tags),
      sections: toArray(payload.sections),
      recipients: toArray(payload.recipients),
      metrics: Array.isArray(payload.metrics) ? payload.metrics : [],
      distribution: Array.isArray(payload.distribution) ? payload.distribution : [],
      schedule: {
        enabled: Boolean(payload?.schedule?.enabled || payload.scheduleEnabled),
        frequency: payload?.schedule?.frequency || payload.scheduleFrequency || '',
        nextRunAt: toDate(payload?.schedule?.nextRunAt || payload.scheduleNextRunAt),
      },
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    res.status(201).json(doc);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Report code already exists' });
    }
    res.status(500).json({ message: 'Failed to create emergency report' });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = req.body || {};
    const updates = {
      ...payload,
      status: normalizeStatus(payload.status),
      priority: normalizePriority(payload.priority),
      generatedAt: payload.generatedAt ? toDate(payload.generatedAt) : undefined,
      timeframe: {
        start: toDate(payload?.timeframe?.start || payload.timeframeStart),
        end: toDate(payload?.timeframe?.end || payload.timeframeEnd),
      },
      tags: payload.tags !== undefined ? toArray(payload.tags) : undefined,
      sections: payload.sections !== undefined ? toArray(payload.sections) : undefined,
      recipients: payload.recipients !== undefined ? toArray(payload.recipients) : undefined,
      metrics: Array.isArray(payload.metrics) ? payload.metrics : undefined,
      distribution: Array.isArray(payload.distribution) ? payload.distribution : undefined,
      schedule: payload.schedule ? {
        enabled: Boolean(payload.schedule.enabled),
        frequency: payload.schedule.frequency || '',
        nextRunAt: toDate(payload.schedule.nextRunAt),
      } : undefined,
      updatedBy: req.user?._id,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const doc = await EmergencyReport.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Report not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update emergency report' });
  }
};

exports.remove = async (req, res) => {
  try {
    const out = await EmergencyReport.findByIdAndDelete(req.params.id);
    if (!out) return res.status(404).json({ message: 'Report not found' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete emergency report' });
  }
};
