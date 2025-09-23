const mongoose = require('mongoose');

const roles = ['crew', 'health', 'emergency', 'inventory', 'admin'];

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, required: true },
    crewId: { type: String }, // optional for crew members
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
