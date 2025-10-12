const mongoose = require('mongoose');

const AdminAnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    message: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal',
      index: true
    },
    audience: {
      type: [String],
      default: ['all'],
      index: true,
      set: (value) => {
        if (!value) return ['all'];
        if (Array.isArray(value)) return value.filter(Boolean);
        if (typeof value === 'string') {
          return value.split(',').map((v) => v.trim()).filter(Boolean);
        }
        return ['all'];
      }
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
      index: true
    },
    publishAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: Date,
    acknowledgementRequired: {
      type: Boolean,
      default: false
    },
    acknowledgementDue: Date,
    acknowledgedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        acknowledgedAt: {
          type: Date,
          default: Date.now
        },
        notes: String
      }
    ],
    attachments: [
      {
        originalName: String,
        fileName: String,
        mimeType: String,
        size: Number,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdByName: {
      type: String,
      default: 'Administrator'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedByName: String,
    archivedAt: Date,
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

AdminAnnouncementSchema.index({ title: 'text', message: 'text', tags: 'text' });
AdminAnnouncementSchema.index({ publishAt: 1, status: 1 });
AdminAnnouncementSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('AdminAnnouncement', AdminAnnouncementSchema);
