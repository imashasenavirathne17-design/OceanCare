const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    currentValue: { type: Number, required: true },
    unit: { type: String, default: '%' },
    previousValue: { type: Number, default: null },
    target: { type: Number, default: null },
    trend: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['success', 'warning', 'danger', 'info'],
      default: 'info'
    },
    notes: { type: String }
  },
  { _id: false }
);

const FileSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true }
  },
  { _id: false }
);

const ScheduleSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      default: 'monthly'
    },
    nextRunAt: { type: Date },
    recipients: [{ type: String }]
  },
  { _id: false }
);

const CertificateSchema = new mongoose.Schema(
  {
    crewMember: { type: String, required: true },
    certificateType: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ['valid', 'expired', 'pending'],
      default: 'valid'
    }
  },
  { _id: false }
);

const HealthReportSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['summary', 'analytics', 'certificate', 'scheduled'],
      default: 'summary',
      index: true
    },
    reportType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: { type: String },
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    generatedBy: { type: String, default: 'Health Officer' },
    generatedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['draft', 'processing', 'completed', 'scheduled'],
      default: 'completed',
      index: true
    },
    sections: [{ type: String }],
    formats: [{
      type: String,
      enum: ['pdf', 'excel', 'powerpoint', 'dashboard']
    }],
    fileSize: { type: Number },
    files: [FileSchema],
    metrics: [MetricSchema],
    certificateInfo: CertificateSchema,
    schedule: ScheduleSchema,
    tags: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

HealthReportSchema.index({ category: 1, generatedAt: -1 });
HealthReportSchema.index({ 'schedule.enabled': 1, 'schedule.nextRunAt': 1 });
HealthReportSchema.index({ 'certificateInfo.status': 1 });

module.exports = mongoose.model('HealthReport', HealthReportSchema);
