const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String, default: 'System' },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'access', 'login', 'logout', 'export', 'other'],
      default: 'other',
      index: true
    },
    resource: { type: String, required: true, index: true },
    ipAddress: { type: String },
    status: { type: String, enum: ['success', 'failure'], default: 'success', index: true },
    details: { type: String },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

AuditLogSchema.index({ userName: 'text', action: 'text', resource: 'text', details: 'text' });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
