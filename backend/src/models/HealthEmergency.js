const mongoose = require('mongoose');

const RecipientSchema = new mongoose.Schema(
  {
    role: { type: String, trim: true },
    notified: { type: Boolean, default: true },
  },
  { _id: false }
);

const AcknowledgementSchema = new mongoose.Schema(
  {
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedByName: { type: String, trim: true },
    acknowledgedAt: { type: Date },
  },
  { _id: false }
);

const ResolutionSchema = new mongoose.Schema(
  {
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedByName: { type: String, trim: true },
    resolutionSummary: { type: String, trim: true },
    resolvedAt: { type: Date },
  },
  { _id: false }
);

const HealthEmergencySchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true },
    crewId: { type: String, trim: true },
    emergencyType: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'moderate',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'],
      default: 'reported',
      index: true,
    },
    location: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    immediateActions: { type: String, trim: true },
    reportedAt: { type: Date, default: Date.now, index: true },
    expectedArrival: { type: Date },
    recipients: { type: [RecipientSchema], default: [] },
    notifyCaptain: { type: Boolean, default: false },
    notifyEmergencyTeam: { type: Boolean, default: true },
    acknowledgement: { type: AcknowledgementSchema, default: () => ({}) },
    resolution: { type: ResolutionSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

HealthEmergencySchema.index({ emergencyType: 1, severity: 1 });
HealthEmergencySchema.index({ status: 1, reportedAt: -1 });
HealthEmergencySchema.index({ createdBy: 1, reportedAt: -1 });

module.exports = mongoose.model('HealthEmergency', HealthEmergencySchema);
