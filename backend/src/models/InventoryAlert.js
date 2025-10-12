const mongoose = require('mongoose');

const InventoryAlertSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    category: { type: String, trim: true },
    currentStock: { type: Number, min: 0, default: 0 },
    minimumRequired: { type: Number, min: 0, default: 0 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    message: { type: String, required: true, trim: true },
    recipient: { type: String, default: 'inventory-manager', trim: true },
    deliveryMethods: [{ type: String, enum: ['system', 'email', 'sms'] }],
    status: { type: String, enum: ['draft', 'sent', 'acknowledged', 'resolved'], default: 'sent', index: true },
    sentAt: { type: Date },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

InventoryAlertSchema.index({ itemName: 1, createdAt: -1 });
InventoryAlertSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('InventoryAlert', InventoryAlertSchema);
