const mongoose = require('mongoose');

const ExaminationSchema = new mongoose.Schema(
  {
    crewId: { type: String, required: true, index: true },
    examType: { type: String, required: true }, // e.g., routine, pre-voyage, post-treatment, chronic, emergency
    reason: { type: String },
    examDate: { type: Date, required: true },
    vitals: {
      temp: String,
      bp: String,
      hr: String,
      spo2: String,
    },
    findings: { type: String },
    recommendations: { type: String },
    files: [{
      originalName: String,
      fileName: String,
      mimeType: String,
      size: Number,
      path: String,
    }],
    status: { type: String, enum: ['Scheduled', 'In Progress', 'Overdue', 'Completed'], default: 'Scheduled' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Examination', ExaminationSchema);
