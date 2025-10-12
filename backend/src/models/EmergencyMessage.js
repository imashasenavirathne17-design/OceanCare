const mongoose = require('mongoose');

const EmergencyMessageSchema = new mongoose.Schema(
  {
    threadId: { type: String, required: true, index: true },
    fromId: { type: String, required: true },
    fromName: { type: String, required: true },
    toId: { type: String, required: true },
    toName: { type: String, required: true },
    recipientType: { type: String, enum: ['individual', 'group'], default: 'individual' },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    content: { type: String, required: true },
    attachments: [{
      name: String,
      url: String,
      mimeType: String,
      size: Number,
    }],
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    sentAt: { type: Date, default: Date.now },
    readAt: { type: Date },
    metadata: {
      location: String,
      protocol: String,
    },
  },
  { timestamps: true }
);

EmergencyMessageSchema.index({ threadId: 1, sentAt: -1 });

const EmergencyMessage = mongoose.model('EmergencyMessage', EmergencyMessageSchema);

module.exports = { EmergencyMessage };
