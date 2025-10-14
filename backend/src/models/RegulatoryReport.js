const mongoose = require('mongoose');

const RegulatoryReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    agency: { type: String, required: true, trim: true, index: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'adhoc'], default: 'monthly', index: true },
    format: { type: String, enum: ['pdf', 'csv', 'xlsx', 'json'], default: 'pdf' },
    status: { type: String, enum: ['draft', 'scheduled', 'completed', 'failed'], default: 'scheduled', index: true },
    dueDate: { type: Date },
    lastRunAt: { type: Date },
    ownerName: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdByName: { type: String, default: 'Administrator' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedByName: { type: String, default: '' }
  },
  { timestamps: true }
);

RegulatoryReportSchema.index({ title: 'text', description: 'text', agency: 'text' });

module.exports = mongoose.model('RegulatoryReport', RegulatoryReportSchema);
