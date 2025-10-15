const mongoose = require('mongoose');

const InventoryWasteRecordSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    disposalType: {
      type: String,
      enum: ['expired', 'damaged', 'recalled', 'other'],
      default: 'expired',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    quantity: { type: Number, min: 0, default: 0 },
    unit: { type: String, default: 'units' },
    method: {
      type: String,
      enum: ['medical-waste', 'hazardous-waste', 'general-waste', 'recycling', 'incineration', 'other'],
      default: 'medical-waste',
    },
    location: { type: String, default: '' },
    reporter: { type: String, default: '' },
    reason: { type: String, default: '' },
    notes: { type: String, default: '' },
    attachments: { type: [String], default: [] },
    scheduledDate: { type: Date },
    disposalDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

InventoryWasteRecordSchema.index({ itemName: 'text', reason: 'text', notes: 'text', location: 'text' });

module.exports = mongoose.model('InventoryWasteRecord', InventoryWasteRecordSchema);
