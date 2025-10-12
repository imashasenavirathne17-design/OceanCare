const mongoose = require('mongoose');

const sessionTypes = ['individual', 'group', 'crisis', 'followup', 'telehealth'];

const mentalHealthSessionSchema = new mongoose.Schema(
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
    sessionDate: {
      type: Date,
      required: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 10,
      max: 240
    },
    sessionType: {
      type: String,
      enum: sessionTypes,
      default: 'individual'
    },
    focusAreas: [String],
    notes: String,
    recommendations: String,
    riskAssessment: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    followUpDate: Date,
    healthOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    healthOfficerName: String,
    attachments: [
      {
        originalName: String,
        fileName: String,
        mimeType: String,
        size: Number,
        path: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

mentalHealthSessionSchema.index({ crewId: 1, sessionDate: -1 });
mentalHealthSessionSchema.index({ sessionType: 1, sessionDate: -1 });

module.exports = mongoose.model('MentalHealthSession', mentalHealthSessionSchema);
