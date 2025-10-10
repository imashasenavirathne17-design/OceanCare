const mongoose = require('mongoose');

const roles = ['crew', 'health', 'emergency', 'inventory', 'admin'];

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, required: true },
    crewId: { type: String }, // optional for crew members
    vessel: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    mfaEnabled: { type: Boolean, default: false },
    lastLogin: { type: Date },
    dob: { type: Date },
    nationality: { type: String, trim: true },
    gender: { type: String, trim: true },
    phone: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    emergency: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    extra: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.index({ fullName: 'text', email: 'text' });

const User = mongoose.model('User', userSchema);

module.exports = { User, roles };
