const { User } = require('../models/User');
const { MedicalRecord } = require('../models/MedicalRecord');

// List crew members for Health Officers to assign examinations
exports.listCrewMembers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = { role: 'crew' };
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { crewId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    const items = await User.find(filter)
      .sort({ fullName: 1 })
      .select('fullName crewId email status')
      .lean();
    return res.json(items);
  } catch (e) {
    console.error('listCrewMembers error', e);
    return res.status(500).json({ message: 'Failed to list crew members' });
  }
};

// Get a single medical record
exports.getMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MedicalRecord.findById(id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (e) {
    console.error('getMedicalRecord error', e);
    return res.status(500).json({ message: 'Failed to get medical record' });
  }
};

// Update a medical record (accepts multipart to append files)
exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = (({ crewId, recordType, condition, date, notes }) => ({ crewId, recordType, condition, date, notes }))(req.body);
    Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

    const files = (req.files || []).map((f) => ({
      filename: f.filename,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: f.path,
    }));

    if (files.length) {
      patch.$push = { files: { $each: files } };
    }

    // If crewId changes, try to refresh crewName
    if (patch.crewId) {
      try {
        const crew = await User.findOne({ crewId: patch.crewId }).select('fullName').lean();
        if (crew && crew.fullName) patch.crewName = crew.fullName;
      } catch {}
    }

    const updated = await MedicalRecord.findByIdAndUpdate(
      id,
      patch,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    return res.json(updated);
  } catch (e) {
    console.error('updateMedicalRecord error', e);
    return res.status(500).json({ message: 'Failed to update medical record' });
  }
};

// Delete a medical record
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const out = await MedicalRecord.findByIdAndDelete(id).lean();
    if (!out) return res.status(404).json({ message: 'Not found' });
    return res.json({ ok: true });
  } catch (e) {
    console.error('deleteMedicalRecord error', e);
    return res.status(500).json({ message: 'Failed to delete medical record' });
  }
};

// Create a medical record (with optional file uploads)
exports.createMedicalRecord = async (req, res) => {
  try {
    const { crewId, recordType, condition, date, notes } = req.body;
    if (!crewId || !recordType || !condition || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const files = (req.files || []).map((f) => ({
      filename: f.filename,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: f.path,
    }));

    // Best-effort resolve crewName
    let crewName;
    try {
      const crew = await User.findOne({ crewId }).select('fullName').lean();
      crewName = crew && crew.fullName;
    } catch {}

    const doc = await MedicalRecord.create({
      crewId,
      crewName,
      recordType,
      condition,
      date,
      notes: notes || '',
      files,
      createdBy: (req.user && req.user.id) || undefined,
    });
    return res.status(201).json(doc);
  } catch (e) {
    console.error('createMedicalRecord error', e);
    return res.status(500).json({ message: 'Failed to create medical record' });
  }
};

// List medical records (basic filtering)
exports.listMedicalRecords = async (req, res) => {
  try {
    const { q = '', type, crewId } = req.query;
    const filter = {};
    if (crewId) filter.crewId = crewId;
    if (type) filter.recordType = type;
    if (q) {
      filter.$or = [
        { condition: { $regex: q, $options: 'i' } },
        { recordType: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }
    const items = await MedicalRecord.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(items);
  } catch (e) {
    console.error('listMedicalRecords error', e);
    return res.status(500).json({ message: 'Failed to list medical records' });
  }
};
