const mongoose = require('mongoose');

const VitalSchema = new mongoose.Schema({ icon: String, label: String }, { _id: false });

const MetaSchema = new mongoose.Schema({
  user: { type: String, required: true },
  location: { type: String, required: true },
  triggered: { type: String },
}, { _id: false });

const EmergencyAlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
  status: { type: String, enum: ['NEW', 'ACKNOWLEDGED', 'RESOLVED'], default: 'NEW' },
  incidentType: { type: String, default: 'Medical' },
  notifyTeam: { type: Boolean, default: true },
  description: { type: String, default: '' },
  meta: { type: MetaSchema, required: true },
  vitals: { type: [VitalSchema], default: [] },
  footerTime: { type: String, default: '' },
  icon: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyAlert', EmergencyAlertSchema);
