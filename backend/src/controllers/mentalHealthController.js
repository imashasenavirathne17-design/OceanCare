const fs = require('fs');
const path = require('path');
const MentalHealthObservation = require('../models/MentalHealthObservation');
const MentalHealthSession = require('../models/MentalHealthSession');
const { User } = require('../models/User');

const uploadsDir = path.join(process.cwd(), 'uploads', 'mental-health');
fs.mkdirSync(uploadsDir, { recursive: true });

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const resolveCrewName = async (crewId, fallback) => {
  if (!crewId) return fallback;
  try {
    const crew = await User.findOne({ crewId }).select('fullName').lean();
    if (crew?.fullName) return crew.fullName;
  } catch (err) {
    console.error('resolveCrewName error', err);
  }
  return fallback || '';
};

// ==================== OBSERVATIONS ====================

exports.listObservations = async (req, res) => {
  try {
    const {
      q = '',
      crewId,
      riskLevel,
      status,
      from,
      to,
      sort = 'observationDate',
      order = 'desc',
      limit = 100,
    } = req.query;

    const filter = {};
    if (crewId) filter.crewId = crewId;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (status) filter.status = status;
    if (from || to) {
      filter.observationDate = {};
      if (from) filter.observationDate.$gte = new Date(from);
      if (to) filter.observationDate.$lte = new Date(to);
    }
    if (q) {
      const regex = { $regex: q, $options: 'i' };
      filter.$or = [
        { crewName: regex },
        { crewId: regex },
        { concerns: regex },
        { notes: regex },
        { tags: regex },
      ];
    }

    const items = await MentalHealthObservation.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .limit(Number(limit))
      .lean();

    return res.json(items);
  } catch (err) {
    console.error('listObservations error', err);
    return res.status(500).json({ message: 'Failed to list observations' });
  }
};

exports.getObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MentalHealthObservation.findById(id).lean();
    if (!doc) return res.status(404).json({ message: 'Observation not found' });
    return res.json(doc);
  } catch (err) {
    console.error('getObservation error', err);
    return res.status(500).json({ message: 'Failed to get observation' });
  }
};

exports.createObservation = async (req, res) => {
  try {
    const {
      crewId,
      crewName,
      observationDate,
      concerns,
      symptoms,
      riskLevel,
      status,
      moodScore,
      stressLevel,
      notes,
      interventions,
      recommendations,
      tags,
      lastSessionDate,
    } = req.body;

    if (!crewId || !observationDate || !concerns) {
      return res.status(400).json({ message: 'crewId, observationDate, and concerns are required' });
    }

    const resolvedCrewName = await resolveCrewName(crewId, crewName);

    const doc = await MentalHealthObservation.create({
      crewId,
      crewName: resolvedCrewName,
      observationDate: new Date(observationDate),
      concerns,
      symptoms: normalizeList(symptoms),
      riskLevel,
      status,
      moodScore,
      stressLevel,
      notes,
      interventions,
      recommendations,
      tags: normalizeList(tags),
      lastSessionDate: lastSessionDate ? new Date(lastSessionDate) : undefined,
      createdBy: req.user?.id,
      createdByName: req.user?.fullName,
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error('createObservation error', err);
    return res.status(500).json({ message: 'Failed to create observation' });
  }
};

exports.updateObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = { ...req.body };

    if (patch.observationDate) patch.observationDate = new Date(patch.observationDate);
    if (patch.lastSessionDate) patch.lastSessionDate = new Date(patch.lastSessionDate);
    if (patch.symptoms) patch.symptoms = normalizeList(patch.symptoms);
    if (patch.tags) patch.tags = normalizeList(patch.tags);

    if (patch.crewId && !patch.crewName) {
      patch.crewName = await resolveCrewName(patch.crewId, patch.crewName);
    }

    patch.updatedBy = req.user?.id;
    patch.updatedByName = req.user?.fullName;

    const updated = await MentalHealthObservation.findByIdAndUpdate(
      id,
      patch,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Observation not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateObservation error', err);
    return res.status(500).json({ message: 'Failed to update observation' });
  }
};

exports.deleteObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MentalHealthObservation.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: 'Observation not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('deleteObservation error', err);
    return res.status(500).json({ message: 'Failed to delete observation' });
  }
};

// ==================== SESSIONS ====================

const mapAttachments = (files = []) =>
  files.map((file) => ({
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
  }));

exports.listSessions = async (req, res) => {
  try {
    const {
      q = '',
      crewId,
      sessionType,
      from,
      to,
      limit = 100,
      sort = 'sessionDate',
      order = 'desc',
    } = req.query;

    const filter = {};
    if (crewId) filter.crewId = crewId;
    if (sessionType) filter.sessionType = sessionType;
    if (from || to) {
      filter.sessionDate = {};
      if (from) filter.sessionDate.$gte = new Date(from);
      if (to) filter.sessionDate.$lte = new Date(to);
    }
    if (q) {
      const regex = { $regex: q, $options: 'i' };
      filter.$or = [
        { crewName: regex },
        { crewId: regex },
        { focusAreas: regex },
        { notes: regex },
        { recommendations: regex },
      ];
    }

    const items = await MentalHealthSession.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .limit(Number(limit))
      .lean();

    return res.json(items);
  } catch (err) {
    console.error('listSessions error', err);
    return res.status(500).json({ message: 'Failed to list sessions' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MentalHealthSession.findById(id).lean();
    if (!doc) return res.status(404).json({ message: 'Session not found' });
    return res.json(doc);
  } catch (err) {
    console.error('getSession error', err);
    return res.status(500).json({ message: 'Failed to get session' });
  }
};

exports.createSession = async (req, res) => {
  try {
    const {
      crewId,
      crewName,
      sessionDate,
      durationMinutes,
      sessionType,
      focusAreas,
      notes,
      recommendations,
      riskAssessment,
      followUpDate,
    } = req.body;

    if (!crewId || !sessionDate || !durationMinutes) {
      return res.status(400).json({ message: 'crewId, sessionDate, and durationMinutes are required' });
    }

    const resolvedCrewName = await resolveCrewName(crewId, crewName);
    const attachments = mapAttachments(req.files || []);

    const doc = await MentalHealthSession.create({
      crewId,
      crewName: resolvedCrewName,
      sessionDate: new Date(sessionDate),
      durationMinutes,
      sessionType,
      focusAreas: normalizeList(focusAreas),
      notes,
      recommendations,
      riskAssessment,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      healthOfficerId: req.user?.id,
      healthOfficerName: req.user?.fullName,
      attachments,
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error('createSession error', err);
    return res.status(500).json({ message: 'Failed to create session' });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = { ...req.body };

    if (patch.sessionDate) patch.sessionDate = new Date(patch.sessionDate);
    if (patch.followUpDate) patch.followUpDate = new Date(patch.followUpDate);
    if (patch.focusAreas) patch.focusAreas = normalizeList(patch.focusAreas);

    if (patch.crewId && !patch.crewName) {
      patch.crewName = await resolveCrewName(patch.crewId, patch.crewName);
    }

    if ((req.files || []).length) {
      patch.$push = {
        attachments: { $each: mapAttachments(req.files) },
      };
    }

    const updated = await MentalHealthSession.findByIdAndUpdate(
      id,
      patch,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Session not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateSession error', err);
    return res.status(500).json({ message: 'Failed to update session' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MentalHealthSession.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: 'Session not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('deleteSession error', err);
    return res.status(500).json({ message: 'Failed to delete session' });
  }
};

// ==================== SUMMARY ====================

exports.getDashboardSummary = async (req, res) => {
  try {
    const [riskCounts, statusCounts, recentSessions, upcomingFollowups] = await Promise.all([
      MentalHealthObservation.aggregate([
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      ]),
      MentalHealthObservation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      MentalHealthSession.find()
        .sort({ sessionDate: -1 })
        .limit(5)
        .lean(),
      MentalHealthSession.find({
        followUpDate: { $gte: new Date() },
      })
        .sort({ followUpDate: 1 })
        .limit(5)
        .lean(),
    ]);

    const normalizeCounts = (items) => {
      const out = {};
      items.forEach((item) => {
        out[item._id || 'unknown'] = item.count;
      });
      return out;
    };

    return res.json({
      riskCounts: normalizeCounts(riskCounts),
      statusCounts: normalizeCounts(statusCounts),
      recentSessions,
      upcomingFollowups,
      totalObservations: riskCounts.reduce((acc, cur) => acc + cur.count, 0),
      totalSessions: recentSessions.length,
    });
  } catch (err) {
    console.error('getDashboardSummary error', err);
    return res.status(500).json({ message: 'Failed to load mental health summary' });
  }
};
