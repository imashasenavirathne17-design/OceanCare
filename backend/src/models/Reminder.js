const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema(
  {
    // Basic reminder info
    type: {
      type: String,
      enum: ['medication', 'followup', 'test', 'other'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    
    // Patient/Crew information
    crewId: {
      type: String,
      required: true,
      index: true
    },
    crewName: {
      type: String,
      required: true
    },
    
    // Medication-specific fields
    medication: {
      name: String,
      dosage: String,
      frequency: {
        type: String,
        enum: ['daily', 'twice-daily', 'weekly', 'as-needed', 'custom']
      },
      times: [String], // Array of times like ['08:00', '20:00']
      instructions: String
    },
    
    // Follow-up specific fields
    followup: {
      followupType: String, // e.g., 'Diabetes Review', 'Hypertension Check'
      lastCheckDate: Date,
      nextDueDate: Date,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      notes: String
    },
    
    // Scheduling
    scheduledDate: {
      type: Date,
      required: true,
      index: true
    },
    scheduledTime: String, // Format: 'HH:MM'
    
    // Status and tracking
    status: {
      type: String,
      enum: ['scheduled', 'pending', 'completed', 'missed', 'snoozed', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    
    // Completion tracking
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedByName: String,
    completionNotes: String,
    
    // Snooze functionality
    snoozeCount: {
      type: Number,
      default: 0
    },
    snoozedUntil: Date,
    
    // Recurrence for recurring reminders
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrencePattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    recurrenceEnd: Date,
    
    // Alert settings
    alertSettings: {
      enabled: {
        type: Boolean,
        default: true
      },
      leadTime: {
        type: Number,
        default: 30 // minutes before scheduled time
      },
      methods: [{
        type: String,
        enum: ['dashboard', 'email', 'sms']
      }]
    },
    
    // Tracking and audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByName: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedByName: String,
    
    // Additional notes and attachments
    notes: String,
    attachments: [{
      originalName: String,
      fileName: String,
      mimeType: String,
      size: Number,
      path: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Tags for categorization
    tags: [String]
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
ReminderSchema.index({ crewId: 1, status: 1 });
ReminderSchema.index({ type: 1, status: 1 });
ReminderSchema.index({ scheduledDate: 1, status: 1 });
ReminderSchema.index({ status: 1, scheduledDate: 1 });
ReminderSchema.index({ createdBy: 1 });
ReminderSchema.index({ 'followup.nextDueDate': 1 });

// Virtual for overdue status
ReminderSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  
  const now = new Date();
  const scheduled = new Date(this.scheduledDate);
  
  if (this.scheduledTime) {
    const [hours, minutes] = this.scheduledTime.split(':');
    scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  return now > scheduled;
});

// Virtual for due today status
ReminderSchema.virtual('isDueToday').get(function() {
  const today = new Date();
  const scheduled = new Date(this.scheduledDate);
  
  return today.toDateString() === scheduled.toDateString();
});

// Method to snooze reminder
ReminderSchema.methods.snooze = function(minutes = 60) {
  this.status = 'snoozed';
  this.snoozeCount += 1;
  this.snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

// Method to mark as completed
ReminderSchema.methods.markCompleted = function(userId, userName, notes = '') {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = userId;
  this.completedByName = userName;
  this.completionNotes = notes;
  return this.save();
};

// Static method to get overdue reminders
ReminderSchema.statics.getOverdue = function() {
  const now = new Date();
  return this.find({
    status: { $in: ['scheduled', 'pending'] },
    scheduledDate: { $lt: now }
  }).sort({ scheduledDate: 1 });
};

// Static method to get today's reminders
ReminderSchema.statics.getTodaysReminders = function() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.find({
    scheduledDate: {
      $gte: startOfDay,
      $lt: endOfDay
    },
    status: { $in: ['scheduled', 'pending'] }
  }).sort({ scheduledTime: 1 });
};

module.exports = mongoose.model('Reminder', ReminderSchema);
