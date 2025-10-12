const mongoose = require('mongoose');

const riskLevels = ['low', 'medium', 'high', 'critical'];
const statuses = ['under_observation', 'monitoring', 'referred', 'resolved'];

const mentalHealthObservationSchema = new mongoose.Schema(
  {
    crewId: {
      type: String,
      required: true,
      index: true
    },
    crewName: {
      type: String,
      required: true
    },
    observationDate: {
      type: Date,
      required: true,
      index: true
    },
    concerns: {
      type: String,
      required: true
    },
    symptoms: [String],
    riskLevel: {
      type: String,
      enum: riskLevels,
      default: 'low',
      index: true
    },
    status: {
      type: String,
      enum: statuses,
      default: 'under_observation',
      index: true
    },
    moodScore: {
      type: Number,
      min: 0,
      max: 100
    },
    stressLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    notes: String,
    interventions: String,
    recommendations: String,
    tags: [String],
    lastSessionDate: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdByName: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedByName: String
  },
  { timestamps: true }
);

mentalHealthObservationSchema.index({ crewId: 1, riskLevel: 1 });
mentalHealthObservationSchema.index({ status: 1, observationDate: -1 });
mentalHealthObservationSchema.index({ observationDate: -1 });

module.exports = mongoose.model('MentalHealthObservation', mentalHealthObservationSchema);
