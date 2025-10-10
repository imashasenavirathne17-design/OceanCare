const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    // Optional programmatic key for built-in roles
    key: { type: String, unique: true, sparse: true }, // e.g., 'crew','health','emergency','inventory','admin'
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    permissions: { type: [String], default: [] }, // e.g., 'users.read', 'users.write', 'inventory.manage'
    system: { type: Boolean, default: false }, // protect built-in roles from deletion
  },
  { timestamps: true }
);

roleSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Role', roleSchema);
