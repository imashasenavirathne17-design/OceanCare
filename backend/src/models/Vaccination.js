const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    issueDate: Date,
    validUntil: Date,
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const VaccinationSchema = new mongoose.Schema(
  {
    crewId: { type: String, required: true, trim: true, index: true },
    crewName: { type: String, trim: true },
    vaccine: { type: String, required: true, trim: true, index: true },
    doseNumber: { type: String, trim: true }, // Supports 1st, 2nd, booster, etc.
    batchNumber: { type: String, trim: true },
    administeredAt: { type: Date, required: true, index: true },
    nextDoseAt: { type: Date, index: true },
    validUntil: { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'up-to-date', 'due-soon', 'overdue', 'completed'],
      default: 'up-to-date',
      index: true,
    },
    notes: { type: String, trim: true },
    certificate: CertificateSchema,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String, trim: true },
  },
  { timestamps: true }
);

VaccinationSchema.index({ crewId: 1, vaccine: 1, administeredAt: -1 });
VaccinationSchema.index({ status: 1, nextDoseAt: 1 });

module.exports = mongoose.model('Vaccination', VaccinationSchema);
