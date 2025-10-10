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
  },
  { timestamps: true }
);

const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);
module.exports = { MedicalRecord };
