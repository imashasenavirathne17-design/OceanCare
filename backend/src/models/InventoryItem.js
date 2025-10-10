const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    icon: { type: String, default: 'box' },
    iconClass: { type: String, default: 'supplies' },
    qty: { type: Number, required: true, min: 0, default: 0 },
    min: { type: Number, required: true, min: 0, default: 0 },
    expiry: { type: Date },
    zone: { type: String, trim: true },
    supplier: { type: String, trim: true },
    barcode: { type: String, trim: true, index: true },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
