const mongoose = require('mongoose');

const InventoryRestockOrderSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 1, required: true },
    unit: { type: String, default: 'units' },
    type: {
      type: String,
      enum: ['emergency', 'standard'],
      default: 'standard',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    expiry: { type: Date },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

InventoryRestockOrderSchema.index({ itemName: 'text', notes: 'text' });
InventoryRestockOrderSchema.index({ itemId: 1, status: 1 });

module.exports = mongoose.model('InventoryRestockOrder', InventoryRestockOrderSchema);
