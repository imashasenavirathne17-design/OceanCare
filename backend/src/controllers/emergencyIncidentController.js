const EmergencyIncident = require('../models/EmergencyIncident');

const buildFilters = (query = {}) => {
  const filter = {};
  if (query.status && query.status !== 'All Incidents') {
    filter.status = query.status.toUpperCase().replace(' ', '_');
  }
  if (query.severity && query.severity !== 'All Severities') {
    const map = { Critical: 'critical', Major: 'warning', Minor: 'info' };
    filter.severity = map[query.severity] || query.severity.toLowerCase();
  }
  if (query.category) filter.category = query.category;
  if (query.q) {
    filter.$text = { $search: query.q };
  }
  if (query.startDate || query.endDate) {
    filter.startedAt = {};
    if (query.startDate) filter.startedAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.startedAt.$lte = new Date(query.endDate);
  }
  return filter;
};

exports.list = async (req, res) => {
  try {
    const filter = buildFilters(req.query || {});
    const items = await EmergencyIncident.find(filter).sort({ startedAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list emergency incidents' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const incident = await EmergencyIncident.findById(req.params.id).lean();
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch incident' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.incidentCode || !payload.title || !payload.reportedBy || !payload.patient?.name) {
      return res.status(400).json({ message: 'incidentCode, title, reportedBy, patient.name are required' });
    }
    const doc = await EmergencyIncident.create({
      ...payload,
      severity: (payload.severity || 'info').toLowerCase(),
      status: (payload.status || 'NEW').toUpperCase().replace('-', '_'),
      startedAt: payload.startedAt ? new Date(payload.startedAt) : new Date(),
      lastUpdatedAt: new Date(),
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Incident code already exists' });
    }
    res.status(500).json({ message: 'Failed to create incident' });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.severity) updates.severity = updates.severity.toLowerCase();
    if (updates.status) updates.status = updates.status.toUpperCase().replace('-', '_');
    updates.lastUpdatedAt = new Date();
    updates.updatedBy = req.user?._id;
    const doc = await EmergencyIncident.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Incident not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update incident' });
  }
};

exports.appendTimeline = async (req, res) => {
  try {
    const entry = {
      time: req.body.time ? new Date(req.body.time) : new Date(),
      label: req.body.label || 'Update',
      description: req.body.description || '',
      actor: req.body.actor || (req.user?.fullName || ''),
    };
    const doc = await EmergencyIncident.findByIdAndUpdate(
      req.params.id,
      { $push: { timeline: entry }, $set: { lastUpdatedAt: new Date(), updatedBy: req.user?._id } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Incident not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to append timeline entry' });
  }
};

exports.appendActionLog = async (req, res) => {
  try {
    const entry = {
      time: req.body.time ? new Date(req.body.time) : new Date(),
      officer: req.body.officer || (req.user?.fullName || 'Officer'),
      action: req.body.action || '',
    };
    if (!entry.action) return res.status(400).json({ message: 'action is required' });
    const doc = await EmergencyIncident.findByIdAndUpdate(
      req.params.id,
      { $push: { actionLog: entry }, $set: { lastUpdatedAt: new Date(), updatedBy: req.user?._id } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Incident not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to append action log entry' });
  }
};

exports.resolve = async (req, res) => {
  try {
    const updates = {
      status: 'RESOLVED',
      lastUpdatedAt: new Date(),
      updatedBy: req.user?._id,
    };
    if (req.body.notes) updates.notes = req.body.notes;
    const doc = await EmergencyIncident.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Incident not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to resolve incident' });
  }
};

exports.remove = async (req, res) => {
  try {
    const out = await EmergencyIncident.findByIdAndDelete(req.params.id);
    if (!out) return res.status(404).json({ message: 'Incident not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete incident' });
  }
};
