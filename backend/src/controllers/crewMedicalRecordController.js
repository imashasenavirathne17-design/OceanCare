const { MedicalRecord } = require('../models/MedicalRecord');
const { User } = require('../models/User');

async function resolveCrewContext(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return null;
    }
    const user = await User.findById(userId).select('role crewId fullName').lean();
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return null;
    }
    if (user.role !== 'crew') {
      res.status(403).json({ message: 'Forbidden' });
      return null;
    }
    if (!user.crewId) {
      res.status(400).json({ message: 'Crew profile incomplete' });
      return null;
    }
    return { crewId: user.crewId, crewName: user.fullName || 'Crew Member' };
  } catch (error) {
    console.error('resolveCrewContext error:', error);
    res.status(500).json({ message: 'Failed to resolve crew context' });
    return null;
  }
}

exports.listMyRecords = async (req, res) => {
  const ctx = await resolveCrewContext(req, res);
  if (!ctx) return;
  try {
    const { q = '', type, from, to } = req.query;
    const filter = { crewId: ctx.crewId };
    if (type && type !== 'All Records') {
      filter.recordType = type;
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    if (q) {
      filter.$or = [
        { condition: { $regex: q, $options: 'i' } },
        { recordType: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }
    const items = await MedicalRecord.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    console.error('listMyRecords error:', error);
    res.status(500).json({ message: 'Failed to list medical records' });
  }
};

exports.getMyRecord = async (req, res) => {
  const ctx = await resolveCrewContext(req, res);
  if (!ctx) return;
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, crewId: ctx.crewId }).lean();
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json(record);
  } catch (error) {
    console.error('getMyRecord error:', error);
    res.status(500).json({ message: 'Failed to load medical record' });
  }
};

function mapFiles(files = []) {
  return files.map((f) => ({
    filename: f.filename,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    path: f.path,
  }));
}

exports.createMyRecord = async (req, res) => {
  const ctx = await resolveCrewContext(req, res);
  if (!ctx) return;
  try {
    const recordType = req.body.recordType || req.body['recordType'];
    const condition = req.body.condition || req.body['condition'];
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const notes = req.body.notes || '';

    if (!recordType || !condition) {
      return res.status(400).json({ message: 'recordType and condition are required' });
    }

    const files = mapFiles(req.files);

    const doc = await MedicalRecord.create({
      crewId: ctx.crewId,
      crewName: ctx.crewName,
      recordType,
      condition,
      date,
      notes,
      files,
      createdBy: ctx.crewId,
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('createMyRecord error:', error);
    res.status(500).json({ message: 'Failed to create medical record' });
  }
};

exports.updateMyRecord = async (req, res) => {
  const ctx = await resolveCrewContext(req, res);
  if (!ctx) return;
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, crewId: ctx.crewId });
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const recordType = req.body.recordType ?? req.body['recordType'];
    const condition = req.body.condition ?? req.body['condition'];
    const date = req.body.date ?? req.body['date'];
    const notes = req.body.notes ?? req.body['notes'];

    if (recordType) record.recordType = recordType;
    if (condition) record.condition = condition;
    if (date) record.date = date;
    if (notes !== undefined) record.notes = notes;

    const files = mapFiles(req.files);
    if (files.length) {
      record.files.push(...files);
    }

    await record.save();
    res.json(record);
  } catch (error) {
    console.error('updateMyRecord error:', error);
    res.status(500).json({ message: 'Failed to update medical record' });
  }
};

exports.deleteMyRecord = async (req, res) => {
  const ctx = await resolveCrewContext(req, res);
  if (!ctx) return;
  try {
    const deleted = await MedicalRecord.findOneAndDelete({ _id: req.params.id, crewId: ctx.crewId }).lean();
    if (!deleted) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('deleteMyRecord error:', error);
    res.status(500).json({ message: 'Failed to delete medical record' });
  }
};
