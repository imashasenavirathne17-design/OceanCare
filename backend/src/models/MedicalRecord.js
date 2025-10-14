const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String,
  },
  { _id: false }
);

const MedicalRecordSchema = new mongoose.Schema(
  {
    crewId: { type: String, required: true, index: true },
    crewName: { type: String },
    recordType: { type: String, required: true },
    condition: { type: String, required: true },
    date: { type: String, required: true },
    notes: { type: String, default: '' },
    files: { type: [FileSchema], default: [] },
    createdBy: { type: String }, // user id or email
    status: { type: String, default: 'open', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    nextDueDate: { type: String, default: '' },
  },
  { timestamps: true }
);

const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);
module.exports = { MedicalRecord };
