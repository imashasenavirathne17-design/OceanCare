const Examination = require('../models/Examination');

// Create
exports.createExam = async (req, res) => {
  try {
    const files = (req.files || []).map((f) => ({
      originalName: f.originalname,
      fileName: f.filename,
      mimeType: f.mimetype,
      size: f.size,
      path: f.path,
    }));
    const payload = {
      crewId: req.body.crewId,
      examType: req.body.examType,
      reason: req.body.reason,
      examDate: req.body.examDate,
      vitals: {
        temp: req.body?.temp || req.body?.['vitals[temp]'] || req.body?.vitals?.temp,
        bp: req.body?.bp || req.body?.['vitals[bp]'] || req.body?.vitals?.bp,
        hr: req.body?.hr || req.body?.['vitals[hr]'] || req.body?.vitals?.hr,
        spo2: req.body?.spo2 || req.body?.['vitals[spo2]'] || req.body?.vitals?.spo2,
      },
      findings: req.body.findings,
      recommendations: req.body.recommendations,
      status: req.body.status || 'Scheduled',
      priority: req.body.priority || 'Medium',
      files,
      createdBy: req.user?.id || null,
    };
    const exam = await Examination.create(payload);
    return res.status(201).json(exam);
  } catch (e) {
    console.error('createExam error', e);
    return res.status(500).json({ message: 'Failed to create examination' });
  }
};

// Read list with filters
exports.listExams = async (req, res) => {
  try {
    const { q, status, type, crewId, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.examType = type;
    if (crewId) filter.crewId = crewId;
    if (from || to) {
      filter.examDate = {};
      if (from) filter.examDate.$gte = new Date(from);
      if (to) filter.examDate.$lte = new Date(to);
    }
    if (q) {
      filter.$or = [
        { crewId: { $regex: q, $options: 'i' } },
        { examType: { $regex: q, $options: 'i' } },
        { reason: { $regex: q, $options: 'i' } },
      ];
    }
    const docs = await Examination.find(filter).sort({ examDate: 1 }).lean();
    return res.json(docs);
  } catch (e) {
    console.error('listExams error', e);
    return res.status(500).json({ message: 'Failed to list examinations' });
  }
};

// Read single
exports.getExam = async (req, res) => {
  try {
    const doc = await Examination.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (e) {
    console.error('getExam error', e);
    return res.status(500).json({ message: 'Failed to get examination' });
  }
};

// Update
exports.updateExam = async (req, res) => {
  try {
    const files = (req.files || []).map((f) => ({
      originalName: f.originalname,
      fileName: f.filename,
      mimeType: f.mimetype,
      size: f.size,
      path: f.path,
    }));

    const updates = { ...req.body };
    if (updates.examDate) updates.examDate = new Date(updates.examDate);
    // Merge vitals if provided flat
    if (req.body.temp || req.body.bp || req.body.hr || req.body.spo2) {
      updates.vitals = {
        temp: req.body.temp,
        bp: req.body.bp,
        hr: req.body.hr,
        spo2: req.body.spo2,
      };
    }
    if (files.length) {
      updates.$push = { files: { $each: files } };
    }

    const doc = await Examination.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (e) {
    console.error('updateExam error', e);
    return res.status(500).json({ message: 'Failed to update examination' });
  }
};

// Delete
exports.deleteExam = async (req, res) => {
  try {
    const doc = await Examination.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json({ ok: true });
  } catch (e) {
    console.error('deleteExam error', e);
    return res.status(500).json({ message: 'Failed to delete examination' });
  }
};

// Crew-scoped list (for CrewExaminations page)
exports.listMyExams = async (req, res) => {
  try {
    const crewId = req.user?.crewId || req.query.crewId;
    if (!crewId) return res.status(400).json({ message: 'crewId missing' });
    const docs = await Examination.find({ crewId }).sort({ examDate: 1 }).lean();
    const items = docs.map((e) => ({
      id: String(e._id),
      type: e.examType,
      date: e.examDate,
      scheduledAt: e.examDate,
      performedAt: e.status === 'Completed' ? e.updatedAt : undefined,
      status: e.status,
      notes: e.findings || e.recommendations || e.reason || '',
    }));
    return res.json(items);
  } catch (e) {
    console.error('listMyExams error', e);
    return res.status(500).json({ message: 'Failed to list crew examinations' });
  }
};
