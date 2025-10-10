const EmergencyAlert = require('../models/EmergencyAlert');

// Map UI severities to stored values
const toStoredSeverity = (s = '') => {
  const m = { critical: 'critical', Critical: 'critical', warning: 'warning', Warning: 'warning', info: 'info', Info: 'info' };
  return m[s] || 'info';
};

exports.list = async (req, res) => {
  try {
    const { status, severity, q } = req.query;
    const filter = {};
    if (status && status !== 'All Alerts') filter.status = status.toUpperCase();
    if (severity && severity !== 'All Severities') {
      const map = { Critical: 'critical', Warning: 'warning', Info: 'info' };
      filter.severity = map[severity] || severity;
    }
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { 'meta.user': new RegExp(q, 'i') },
        { 'meta.location': new RegExp(q, 'i') },
      ];
    }
    const items = await EmergencyAlert.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Failed to list emergency alerts' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await EmergencyAlert.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch alert' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, severity, status = 'NEW', incidentType = 'Medical', notifyTeam = true, description = '', meta, vitals = [], icon = '' } = req.body;
    if (!title || !meta || !meta.user || !meta.location) {
      return res.status(400).json({ message: 'title, meta.user, meta.location are required' });
    }
    const doc = await EmergencyAlert.create({
      title,
      severity: toStoredSeverity(severity),
      status,
      incidentType,
      notifyTeam,
      description,
      meta,
      vitals,
      footerTime: req.body.footerTime || '',
      icon,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create alert' });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.severity) updates.severity = toStoredSeverity(updates.severity);
    const doc = await EmergencyAlert.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update alert' });
  }
};

exports.remove = async (req, res) => {
  try {
    const out = await EmergencyAlert.findByIdAndDelete(req.params.id);
    if (!out) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete alert' });
  }
};

exports.acknowledge = async (req, res) => {
  try {
    const by = (req.user && req.user.fullName) || 'Officer';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const doc = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { status: 'ACKNOWLEDGED', footerTime: `Acknowledged: ${time} | By: ${by}` },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Failed to acknowledge alert' });
  }
};

exports.resolve = async (req, res) => {
  try {
    const by = (req.user && req.user.fullName) || 'Officer';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const doc = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { status: 'RESOLVED', footerTime: `Resolved: ${time} | By: ${by}` },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Failed to resolve alert' });
  }
};
