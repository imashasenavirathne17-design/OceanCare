const mongoose = require('mongoose');

const TimelineSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  actor: { type: String, default: '' },
}, { _id: false });

const ActionLogSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  officer: { type: String, required: true },
  action: { type: String, required: true },
}, { _id: false });

const VitalSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  flag: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
}, { _id: false });

const EmergencyIncidentSchema = new mongoose.Schema({
  incidentCode: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  severity: { type: String, enum: ['critical', 'warning', 'info'], default: 'info' },
  status: { type: String, enum: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'], default: 'NEW' },
  category: { type: String, default: 'Medical' },
  location: { type: String, default: '' },
  reportedBy: { type: String, required: true },
  assignedTo: { type: String, default: '' },
  patient: {
    name: { type: String, required: true },
    crewId: { type: String, default: '' },
    role: { type: String, default: '' },
    age: { type: Number },
    bloodType: { type: String, default: '' },
  },
  vitals: { type: [VitalSchema], default: [] },
  startedAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
  timeline: { type: [TimelineSchema], default: [] },
  actionLog: { type: [ActionLogSchema], default: [] },
  attachments: {
    reports: { type: [String], default: [] },
    media: { type: [String], default: [] },
  },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

EmergencyIncidentSchema.index({ incidentCode: 1 });
EmergencyIncidentSchema.index({ status: 1, severity: 1, startedAt: -1 });
EmergencyIncidentSchema.index({ 'patient.name': 'text', title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('EmergencyIncident', EmergencyIncidentSchema);
