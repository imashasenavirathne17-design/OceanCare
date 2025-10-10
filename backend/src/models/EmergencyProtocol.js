const mongoose = require('mongoose');

const EmergencyProtocolSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  description: { type: String, default: '' },
  steps: { type: [String], default: [] },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  tags: { type: [String], default: [] },
  lastReviewedAt: { type: Date },
  createdBy: { type: String },
  updatedBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyProtocol', EmergencyProtocolSchema);
