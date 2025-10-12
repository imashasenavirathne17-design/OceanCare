const mongoose = require('mongoose');

const CrewLocationSchema = new mongoose.Schema(
  {
    crewId: { type: String, required: true, index: true },
    crewName: { type: String, required: true },
    department: { type: String },
    role: { type: String },
    status: { type: String, enum: ['critical', 'warning', 'stable', 'offline'], default: 'stable' },
    location: { type: String, required: true },
    deck: { type: String, default: 'Main Deck' },
    position: {
      top: { type: Number, default: 50 },
      left: { type: Number, default: 50 },
    },
    lastSeenAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

CrewLocationSchema.index({ crewId: 1 }, { unique: true });

const CrewLocation = mongoose.model('CrewLocation', CrewLocationSchema);

module.exports = { CrewLocation };
