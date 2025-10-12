'use strict';

const mongoose = require('mongoose');
const Vaccination = require('../models/Vaccination');
const { User } = require('../models/User');

const resolveCrewName = async (crewId, fallback = '') => {
  if (!crewId) return fallback;
  try {
    const crew = await User.findOne({ crewId }).select('fullName').lean();
    if (crew?.fullName) return crew.fullName;
  } catch (err) {
    console.error('resolveCrewName error', err);
  }
  return fallback;
};

const normalizeStatus = (doc) => {
  if (doc.status) return; // status already set
  const now = new Date();
  if (doc.nextDoseAt && doc.nextDoseAt < now) {
    doc.status = 'overdue';
  } else if (doc.nextDoseAt) {
    const threshold = new Date(doc.nextDoseAt);
    threshold.setMonth(threshold.getMonth() - 1);
    doc.status = threshold <= now ? 'due-soon' : 'up-to-date';
  } else {
    doc.status = 'up-to-date';
  }
};

const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

exports.listVaccinations = async (req, res) => {
  try {
    const {
      q = '',
      crewId,
      vaccine,
      status,
      from,
      to,
      sort = 'administeredAt',
      order = 'desc',
      limit = 100,
    } = req.query;

    const filter = {};
    if (crewId) filter.crewId = crewId;
    if (vaccine) filter.vaccine = vaccine;
    if (status) filter.status = status;
    if (from || to) {
      filter.administeredAt = {};
      if (from) filter.administeredAt.$gte = new Date(from);
      if (to) filter.administeredAt.$lte = new Date(to);
    }
    if (q) {
      const regex = { $regex: q, $options: 'i' };
      filter.$or = [
        { crewName: regex },
        { crewId: regex },
        { vaccine: regex },
        { notes: regex },
        { batchNumber: regex },
      ];
    }

    const docs = await Vaccination.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .limit(Number(limit))
      .lean();

    return res.json(docs);
  } catch (err) {
    console.error('listVaccinations error', err);
    return res.status(500).json({ message: 'Failed to list vaccinations' });
  }
};

exports.getVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vaccination id' });
    }
    const doc = await Vaccination.findById(id).lean();
    if (!doc) return res.status(404).json({ message: 'Vaccination not found' });
    return res.json(doc);
  } catch (err) {
    console.error('getVaccination error', err);
    return res.status(500).json({ message: 'Failed to get vaccination' });
  }
};

exports.createVaccination = async (req, res) => {
  try {
    const {
      crewId,
      crewName,
      vaccine,
      doseNumber,
      batchNumber,
      administeredAt,
      nextDoseAt,
      validUntil,
      status,
      notes,
      certificate,
    } = req.body;

    if (!crewId || !vaccine || !administeredAt) {
      return res.status(400).json({ message: 'crewId, vaccine and administeredAt are required' });
    }

    const payload = {
      crewId,
      crewName: await resolveCrewName(crewId, crewName),
      vaccine,
      doseNumber,
      batchNumber,
      administeredAt: new Date(administeredAt),
      nextDoseAt: nextDoseAt ? new Date(nextDoseAt) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      notes,
      status,
      certificate: certificate
        ? pick(certificate, ['issueDate', 'validUntil', 'notes'])
        : undefined,
      createdBy: req.user?.id,
      createdByName: req.user?.fullName,
    };

    normalizeStatus(payload);

    const doc = await Vaccination.create(payload);
    return res.status(201).json(doc.toObject());
  } catch (err) {
    console.error('createVaccination error', err);
    return res.status(500).json({ message: 'Failed to create vaccination record' });
  }
};

exports.updateVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vaccination id' });
    }

    const patch = pick(req.body, [
      'crewId',
      'crewName',
      'vaccine',
      'doseNumber',
      'batchNumber',
      'administeredAt',
      'nextDoseAt',
      'validUntil',
      'status',
      'notes',
      'certificate',
    ]);

    if (patch.administeredAt) patch.administeredAt = new Date(patch.administeredAt);
    if (patch.nextDoseAt) patch.nextDoseAt = new Date(patch.nextDoseAt);
    if (patch.validUntil) patch.validUntil = new Date(patch.validUntil);

    if (patch.certificate) {
      patch.certificate = pick(patch.certificate, ['issueDate', 'validUntil', 'notes']);
      if (patch.certificate.issueDate) patch.certificate.issueDate = new Date(patch.certificate.issueDate);
      if (patch.certificate.validUntil) patch.certificate.validUntil = new Date(patch.certificate.validUntil);
    }

    if (patch.crewId && !patch.crewName) {
      patch.crewName = await resolveCrewName(patch.crewId, patch.crewName);
    }

    patch.updatedBy = req.user?.id;
    patch.updatedByName = req.user?.fullName;

    normalizeStatus(patch);

    const updated = await Vaccination.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Vaccination not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateVaccination error', err);
    return res.status(500).json({ message: 'Failed to update vaccination' });
  }
};

exports.deleteVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vaccination id' });
    }

    const deleted = await Vaccination.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: 'Vaccination not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('deleteVaccination error', err);
    return res.status(500).json({ message: 'Failed to delete vaccination' });
  }
};

exports.markComplete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vaccination id' });
    }

    const updated = await Vaccination.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        nextDoseAt: undefined,
        updatedBy: req.user?.id,
        updatedByName: req.user?.fullName,
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Vaccination not found' });
    return res.json(updated);
  } catch (err) {
    console.error('markComplete error', err);
    return res.status(500).json({ message: 'Failed to mark vaccination complete' });
  }
};
