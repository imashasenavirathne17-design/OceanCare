const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  currentValue: { type: Number },
  previousValue: { type: Number },
  target: { type: Number },
  unit: { type: String, default: '' },
  trend: { type: String, default: 'steady' },
  status: { type: String, enum: ['positive', 'steady', 'negative'], default: 'steady' },
  notes: { type: String, default: '' },
}, { _id: false });

const DistributionSchema = new mongoose.Schema({
  channel: { type: String, enum: ['email', 'dashboard', 'export', 'api', 'print'], required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  deliveredAt: { type: Date },
  notes: { type: String, default: '' },
}, { _id: false });

const EmergencyReportSchema = new mongoose.Schema({
  reportCode: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  reportType: { type: String, default: 'Incident Analysis' },
  category: { type: String, default: 'Emergency Response' },
  status: { type: String, enum: ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  generatedBy: { type: String, default: '' },
  generatedAt: { type: Date, default: Date.now },
  timeframe: {
    start: { type: Date },
    end: { type: Date },
  },
  tags: { type: [String], default: [] },
  sections: { type: [String], default: [] },
  recipients: { type: [String], default: [] },
  metrics: { type: [MetricSchema], default: [] },
  distribution: { type: [DistributionSchema], default: [] },
  incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyIncident' }],
  notes: { type: String, default: '' },
  attachments: { type: [String], default: [] },
  schedule: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, default: '' },
    nextRunAt: { type: Date },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

EmergencyReportSchema.index({ reportCode: 1 });
EmergencyReportSchema.index({ status: 1, priority: 1, generatedAt: -1 });
EmergencyReportSchema.index({ title: 'text', summary: 'text', tags: 'text', sections: 'text' });

module.exports = mongoose.model('EmergencyReport', EmergencyReportSchema);
