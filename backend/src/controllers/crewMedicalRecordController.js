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

function normalizeStructuredField(input) {
  if (input === undefined) return { provided: false };
  if (input === null) return { provided: true, value: {} };
  if (typeof input === 'object') return { provided: true, value: input };
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return { provided: true, value: {} };
    try {
      return { provided: true, value: JSON.parse(trimmed) };
    } catch (error) {
      return { provided: true, error: 'Invalid JSON' };
    }
  }
  return { provided: true, value: {} };
}

exports.listMyRecords = async (req, res) => {
  const ctx = await resolveCrewContext(req, res);
  if (!ctx) return;
  try {
    const { q = '', type, from, to, status } = req.query;
    const filter = { crewId: ctx.crewId };
    if (type && type !== 'All Records') {
      filter.recordType = type;
    }
    if (status && status !== 'all') {
      filter.status = status;
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
    const status = req.body.status || 'open';
    const nextDueDate = req.body.nextDueDate || '';

    const metadataInput = normalizeStructuredField(req.body.metadata ?? req.body.metadataJson);
    if (metadataInput.error) {
      return res.status(400).json({ message: 'metadata must be valid JSON' });
    }
    const metricsInput = normalizeStructuredField(req.body.metrics ?? req.body.metricsJson);
    if (metricsInput.error) {
      return res.status(400).json({ message: 'metrics must be valid JSON' });
    }

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
      status,
      nextDueDate,
      metadata: metadataInput.provided ? metadataInput.value : {},
      metrics: metricsInput.provided ? metricsInput.value : {},
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
    const status = req.body.status ?? req.body['status'];
    const nextDueDate = req.body.nextDueDate ?? req.body['nextDueDate'];

    const metadataInput = normalizeStructuredField(req.body.metadata ?? req.body.metadataJson);
    if (metadataInput.error) {
      return res.status(400).json({ message: 'metadata must be valid JSON' });
    }
    const metricsInput = normalizeStructuredField(req.body.metrics ?? req.body.metricsJson);
    if (metricsInput.error) {
      return res.status(400).json({ message: 'metrics must be valid JSON' });
    }

    if (recordType) record.recordType = recordType;
    if (condition) record.condition = condition;
    if (date) record.date = date;
    if (notes !== undefined) record.notes = notes;
    if (status !== undefined) record.status = status || 'open';
    if (nextDueDate !== undefined) record.nextDueDate = nextDueDate || '';
    if (metadataInput.provided) record.metadata = metadataInput.value;
    if (metricsInput.provided) record.metrics = metricsInput.value;

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
