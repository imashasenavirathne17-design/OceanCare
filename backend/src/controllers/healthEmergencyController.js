const mongoose = require('mongoose');
const HealthEmergency = require('../models/HealthEmergency');

const { Types } = mongoose;
const VALID_STATUS = ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'];
const VALID_SEVERITY = ['low', 'moderate', 'high', 'critical'];
const VALID_PRIORITY = ['low', 'medium', 'high'];

const toObjectId = (value) => {
  if (!value) return null;
  try {
    return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
  } catch (err) {
    return null;
  }
};

const sanitizeEnum = (value, valid, fallback) => {
  if (!value) return fallback;
  const normalized = String(value).toLowerCase();
  return valid.includes(normalized) ? normalized : fallback;
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const buildFilter = (query = {}) => {
  const filter = {};
  const { q, status, severity, priority, emergencyType, from, to, createdBy } = query;

  if (q) {
    const regex = { $regex: q, $options: 'i' };
    filter.$or = [
      { patientName: regex },
      { crewId: regex },
      { location: regex },
      { emergencyType: regex },
      { description: regex },
      { immediateActions: regex },
      { createdByName: regex },
    ];
  }

  if (status && status !== 'all') {
    const normalizedStatus = sanitizeEnum(status, VALID_STATUS, null);
    if (normalizedStatus) filter.status = normalizedStatus;
  }

  if (severity && severity !== 'all') {
    const normalizedSeverity = sanitizeEnum(severity, VALID_SEVERITY, null);
    if (normalizedSeverity) filter.severity = normalizedSeverity;
  }

  if (priority && priority !== 'all') {
    const normalizedPriority = sanitizeEnum(priority, VALID_PRIORITY, null);
    if (normalizedPriority) filter.priority = normalizedPriority;
  }

  if (emergencyType && emergencyType !== 'all') {
    filter.emergencyType = emergencyType;
  }

  const createdById = toObjectId(createdBy);
  if (createdById) filter.createdBy = createdById;

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (fromDate || toDate) {
    filter.reportedAt = {};
    if (fromDate) filter.reportedAt.$gte = fromDate;
    if (toDate) filter.reportedAt.$lte = toDate;
    if (!Object.keys(filter.reportedAt).length) delete filter.reportedAt;
  }

  return filter;
};

exports.listEmergencies = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = limitParam && limitParam > 0 ? Math.min(limitParam, 100) : 25;
    const skip = (page - 1) * limit;

    const matchFilter = Object.keys(filter).length ? filter : {};

    const [items, total, statusStats, severityStats, priorityStats, recent] = await Promise.all([
      HealthEmergency.find(matchFilter)
        .sort({ reportedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthEmergency.countDocuments(matchFilter),
      HealthEmergency.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      HealthEmergency.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      HealthEmergency.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      HealthEmergency.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const statusBreakdown = VALID_STATUS.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {});
    statusStats.forEach((entry) => {
      if (entry?._id && typeof entry.count === 'number') {
        statusBreakdown[entry._id] = entry.count;
      }
    });

    const severityBreakdown = VALID_SEVERITY.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {});
    severityStats.forEach((entry) => {
      if (entry?._id && typeof entry.count === 'number') {
        severityBreakdown[entry._id] = entry.count;
      }
    });

    const priorityBreakdown = VALID_PRIORITY.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {});
    priorityStats.forEach((entry) => {
      if (entry?._id && typeof entry.count === 'number') {
        priorityBreakdown[entry._id] = entry.count;
      }
    });

    const activeCount = (statusBreakdown.reported || 0) + (statusBreakdown.acknowledged || 0) + (statusBreakdown.in_progress || 0);
    const resolvedCount = (statusBreakdown.resolved || 0) + (statusBreakdown.closed || 0);

    const pages = total ? Math.ceil(total / limit) : 0;

    return res.json({
      items,
      total,
      page,
      pages,
      summary: {
        total,
        activeCount,
        resolvedCount,
        statusBreakdown,
        severityBreakdown,
        priorityBreakdown,
      },
      recent,
    });
  } catch (error) {
    console.error('List health emergencies error:', error);
    return res.status(500).json({ message: 'Failed to list emergencies' });
  }
};

exports.getEmergency = async (req, res) => {
  try {
    const emergency = await HealthEmergency.findById(req.params.id).lean();
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
    return res.json(emergency);
  } catch (error) {
    console.error('Get health emergency error:', error);
    return res.status(500).json({ message: 'Failed to fetch emergency' });
  }
};

exports.createEmergency = async (req, res) => {
  try {
    const {
      patientName,
      crewId,
      emergencyType,
      severity,
      priority,
      status,
      location,
      description,
      immediateActions,
      reportedAt,
      expectedArrival,
      recipients,
      notifyCaptain,
      notifyEmergencyTeam,
      notes,
    } = req.body;

    if (!patientName || !emergencyType || !location) {
      return res.status(400).json({ message: 'patientName, emergencyType, and location are required' });
    }

    const payload = {
      patientName,
      crewId,
      emergencyType,
      severity: sanitizeEnum(severity, VALID_SEVERITY, 'moderate'),
      priority: sanitizeEnum(priority, VALID_PRIORITY, 'medium'),
      status: sanitizeEnum(status, VALID_STATUS, 'reported'),
      location,
      description,
      immediateActions,
      reportedAt: reportedAt ? parseDate(reportedAt) : Date.now(),
      expectedArrival: expectedArrival ? parseDate(expectedArrival) : undefined,
      recipients: Array.isArray(recipients) ? recipients : [],
      notifyCaptain: Boolean(notifyCaptain),
      notifyEmergencyTeam: notifyEmergencyTeam !== false,
      notes,
      createdBy: req.user?._id || null,
      createdByName: req.user?.fullName || req.user?.email || 'System',
      acknowledgement: {},
      resolution: {},
    };

    const doc = await HealthEmergency.create(payload);
    return res.status(201).json(doc);
  } catch (error) {
    console.error('Create health emergency error:', error);
    return res.status(500).json({ message: 'Failed to create emergency' });
  }
};

exports.updateEmergency = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.severity) updates.severity = sanitizeEnum(updates.severity, VALID_SEVERITY, undefined);
    if (updates.priority) updates.priority = sanitizeEnum(updates.priority, VALID_PRIORITY, undefined);
    if (updates.status) updates.status = sanitizeEnum(updates.status, VALID_STATUS, undefined);

    if (updates.reportedAt) updates.reportedAt = parseDate(updates.reportedAt);
    if (updates.expectedArrival) updates.expectedArrival = parseDate(updates.expectedArrival);

    updates.updatedBy = req.user?._id || null;
    updates.updatedByName = req.user?.fullName || req.user?.email || 'System';

    const doc = await HealthEmergency.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Emergency not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Update health emergency error:', error);
    return res.status(500).json({ message: 'Failed to update emergency' });
  }
};

exports.deleteEmergency = async (req, res) => {
  try {
    const doc = await HealthEmergency.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Emergency not found' });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Delete health emergency error:', error);
    return res.status(500).json({ message: 'Failed to delete emergency' });
  }
};

exports.acknowledgeEmergency = async (req, res) => {
  try {
    const now = new Date();
    const doc = await HealthEmergency.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgement: {
          acknowledgedBy: req.user?._id || null,
          acknowledgedByName: req.user?.fullName || req.user?.email || 'Officer',
          acknowledgedAt: now,
        },
        updatedBy: req.user?._id || null,
        updatedByName: req.user?.fullName || req.user?.email || 'Officer',
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: 'Emergency not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Acknowledge health emergency error:', error);
    return res.status(500).json({ message: 'Failed to acknowledge emergency' });
  }
};

exports.resolveEmergency = async (req, res) => {
  try {
    const now = new Date();
    const { resolutionSummary, status } = req.body || {};
    const nextStatus = sanitizeEnum(status, VALID_STATUS, 'resolved');

    const doc = await HealthEmergency.findByIdAndUpdate(
      req.params.id,
      {
        status: nextStatus === 'reported' ? 'resolved' : nextStatus,
        resolution: {
          resolvedBy: req.user?._id || null,
          resolvedByName: req.user?.fullName || req.user?.email || 'Officer',
          resolutionSummary: resolutionSummary || '',
          resolvedAt: now,
        },
        updatedBy: req.user?._id || null,
        updatedByName: req.user?.fullName || req.user?.email || 'Officer',
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: 'Emergency not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Resolve health emergency error:', error);
    return res.status(500).json({ message: 'Failed to resolve emergency' });
  }
};
