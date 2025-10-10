const mongoose = require('mongoose');

const ChronicReadingSchema = new mongoose.Schema(
  {
    patientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ChronicIllness',
      required: true,
      index: true
    },
    crewId: { 
      type: String, 
      required: true,
      index: true
    },
    readingDate: { 
      type: Date, 
      required: true 
    },
    vitals: {
      bloodGlucose: { 
        type: String 
      },
      bloodPressure: { 
        type: String 
      },
      peakFlow: { 
        type: String 
      },
      weight: { 
        type: String 
      },
      temperature: { 
        type: String 
      },
      heartRate: { 
        type: String 
      },
      oxygenSaturation: { 
        type: String 
      }
    },
    symptoms: [{ 
      type: String 
    }],
    medicationAdherence: {
      type: String,
      enum: ['full', 'partial', 'none', 'not_applicable'],
      default: 'not_applicable'
    },
    clinicalNotes: { 
      type: String 
    },
    alertLevel: {
      type: String,
      enum: ['normal', 'attention', 'urgent'],
      default: 'normal'
    },
    followUpRequired: { 
      type: Boolean, 
      default: false 
    },
    attachments: [{
      originalName: String,
      fileName: String,
      mimeType: String,
      size: Number,
      path: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    recordedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    recordedByName: {
      type: String
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
ChronicReadingSchema.index({ patientId: 1, readingDate: -1 });
ChronicReadingSchema.index({ crewId: 1, readingDate: -1 });
ChronicReadingSchema.index({ alertLevel: 1, readingDate: -1 });

module.exports = mongoose.model('ChronicReading', ChronicReadingSchema);
