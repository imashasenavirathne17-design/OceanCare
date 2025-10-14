const mongoose = require('mongoose');

const CrewEmergencyAlertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['medical', 'safety', 'symptoms', 'accident', 'other'],
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'high',
    },
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'resolved', 'cancelled'],
      default: 'reported',
      index: true,
    },
    crewId: {
      type: String,
      trim: true,
    },
    crewMemberId: {
      type: String,
      required: true,
      index: true,
    },
    crewName: {
      type: String,
      trim: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

CrewEmergencyAlertSchema.index({ reportedAt: -1 });

module.exports = mongoose.model('CrewEmergencyAlert', CrewEmergencyAlertSchema);
