const mongoose = require('mongoose');

const ComplianceFrameworkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['compliant', 'partial', 'non_compliant'], default: 'partial', index: true },
    lastAuditAt: { type: Date },
    requirementsTotal: { type: Number, default: 0, min: 0 },
    requirementsMet: { type: Number, default: 0, min: 0 },
    ownerName: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdByName: { type: String, default: 'Administrator' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedByName: { type: String, default: '' }
  },
  { timestamps: true }
);

ComplianceFrameworkSchema.index({ name: 'text', code: 'text', description: 'text' });

module.exports = mongoose.model('ComplianceFramework', ComplianceFrameworkSchema);
