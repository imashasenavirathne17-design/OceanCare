const mongoose = require('mongoose');

const ChronicIllnessSchema = new mongoose.Schema(
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
    conditions: [{ 
      type: String, 
      required: true 
    }],
    primaryCondition: { 
      type: String, 
      required: true 
    },
    severity: { 
      type: String, 
      enum: ['mild', 'moderate', 'severe'], 
      default: 'moderate' 
    },
    diagnosisDate: { 
      type: Date, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['stable', 'warning', 'critical'], 
      default: 'stable' 
    },
    lastReading: {
      date: Date,
      bloodGlucose: String,
      bloodPressure: String,
      peakFlow: String,
      weight: String,
      notes: String
    },
    nextCheckup: { 
      type: Date 
    },
    initialFindings: { 
      type: String 
    },
    treatmentPlan: { 
      type: String 
    },
    monitoringParameters: { 
      type: String 
    },
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date
    }],
    treatmentHistory: [{
      date: Date,
      description: String,
      performedBy: String
    }],
    attachments: [{
      originalName: String,
      fileName: String,
      mimeType: String,
      size: Number,
      path: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    updatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
ChronicIllnessSchema.index({ crewId: 1, status: 1 });
ChronicIllnessSchema.index({ primaryCondition: 1 });
ChronicIllnessSchema.index({ nextCheckup: 1 });

module.exports = mongoose.model('ChronicIllness', ChronicIllnessSchema);
