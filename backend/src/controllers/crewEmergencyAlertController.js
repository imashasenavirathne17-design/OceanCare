const CrewEmergencyAlert = require('../models/CrewEmergencyAlert');

const normalizeType = (value) => {
  if (!value) return undefined;
  const lower = String(value).toLowerCase();
  const allowed = ['medical', 'safety', 'symptoms', 'accident', 'other'];
  return allowed.includes(lower) ? lower : undefined;
};

const normalizeUrgency = (value) => {
  if (!value) return undefined;
  const lower = String(value).toLowerCase();
  const allowed = ['high', 'medium', 'low'];
  return allowed.includes(lower) ? lower : undefined;
};

const normalizeStatus = (value) => {
  if (!value) return undefined;
  const lower = String(value).toLowerCase();
  const allowed = ['reported', 'acknowledged', 'resolved', 'cancelled'];
  return allowed.includes(lower) ? lower : undefined;
};

const getUserId = (req) => {
  if (!req.user) return '';
  return req.user.sub || req.user._id || req.user.id || req.user.userId || '';
};

const getUserName = (req) => req.user?.fullName || req.user?.name || req.user?.email || '';
const getUserRole = (req) => (req.user?.role || '').toLowerCase();

const canManageAlert = (req, alert) => {
  const role = getUserRole(req);
  if (['admin', 'emergency', 'health'].includes(role)) return true;
  const userId = getUserId(req);
  return userId && String(alert.crewMemberId) === String(userId);
};

const buildFilters = (req) => {
  const filter = {};
  const role = getUserRole(req);
  const userId = getUserId(req);

  if (role === 'crew' && userId) {
    filter.crewMemberId = String(userId);
  }

  const { type, status, urgency, q } = req.query || {};

  const normalizedType = normalizeType(type);
  if (normalizedType) filter.type = normalizedType;

  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus) filter.status = normalizedStatus;

  const normalizedUrgency = normalizeUrgency(urgency);
  if (normalizedUrgency) filter.urgency = normalizedUrgency;

  if (q) {
    const regex = new RegExp(String(q).trim(), 'i');
    filter.$or = [
      { description: regex },
      { location: regex },
      { notes: regex },
    ];
  }

  return filter;
};

exports.list = async (req, res) => {
  try {
    const filter = buildFilters(req);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? 100 : Math.min(limitParam || 100, 200);
    const alerts = await CrewEmergencyAlert.find(filter)
      .sort({ reportedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(alerts);
  } catch (err) {
    console.error('CrewEmergencyAlert list error:', err);
    res.status(500).json({ message: 'Failed to load emergency alerts' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const alert = await CrewEmergencyAlert.findById(req.params.id).lean();
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (!canManageAlert(req, alert)) return res.status(403).json({ message: 'Forbidden' });
    res.json(alert);
  } catch (err) {
    console.error('CrewEmergencyAlert getOne error:', err);
    res.status(500).json({ message: 'Failed to fetch alert' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      type,
      location,
      description,
      urgency,
      notes,
    } = req.body || {};

    const normalizedType = normalizeType(type);
    const normalizedUrgency = normalizeUrgency(urgency) || 'high';

    if (!normalizedType || !description) {
      return res.status(400).json({ message: 'type and description are required' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const doc = await CrewEmergencyAlert.create({
      type: normalizedType,
      location: location?.trim() || '',
      description: description.trim(),
      urgency: normalizedUrgency,
      notes: notes?.trim() || '',
      status: 'reported',
      crewId: req.user?.crewId || '',
      crewMemberId: String(userId),
      crewName: getUserName(req),
      reportedAt: new Date(),
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error('CrewEmergencyAlert create error:', err);
    res.status(500).json({ message: 'Failed to create alert' });
  }
};

exports.update = async (req, res) => {
  try {
    const alert = await CrewEmergencyAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (!canManageAlert(req, alert)) return res.status(403).json({ message: 'Forbidden' });

    const updates = {};
    const {
      type,
      location,
      description,
      urgency,
      status,
      notes,
    } = req.body || {};

    const normalizedType = normalizeType(type);
    if (normalizedType) updates.type = normalizedType;

    if (location !== undefined) updates.location = location ? location.trim() : '';
    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ message: 'description cannot be empty' });
      }
      updates.description = description.trim();
    }

    const normalizedUrgency = normalizeUrgency(urgency);
    if (normalizedUrgency) updates.urgency = normalizedUrgency;

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      const role = getUserRole(req);
      if (role === 'crew' && normalizedStatus !== 'reported' && normalizedStatus !== 'cancelled') {
        return res.status(403).json({ message: 'Crew can only mark alerts as reported or cancelled' });
      }
      updates.status = normalizedStatus;
      if (normalizedStatus === 'acknowledged') {
        updates.acknowledgedAt = updates.acknowledgedAt || new Date();
      }
      if (normalizedStatus === 'resolved') {
        updates.resolvedAt = new Date();
      }
      if (normalizedStatus === 'cancelled') {
        updates.resolvedAt = undefined;
      }
    }

    if (notes !== undefined) updates.notes = notes ? notes.trim() : '';

    updates.updatedAt = new Date();

    Object.assign(alert, updates);
    await alert.save();

    res.json(alert);
  } catch (err) {
    console.error('CrewEmergencyAlert update error:', err);
    res.status(500).json({ message: 'Failed to update alert' });
  }
};

exports.remove = async (req, res) => {
  try {
    const alert = await CrewEmergencyAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (!canManageAlert(req, alert)) return res.status(403).json({ message: 'Forbidden' });

    await alert.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error('CrewEmergencyAlert remove error:', err);
    res.status(500).json({ message: 'Failed to delete alert' });
  }
};
