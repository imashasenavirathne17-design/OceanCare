const bcrypt = require('bcryptjs');
const { User } = require('../models/User');

// Build a Mongo filter from query params
function buildFilter(query) {
  const { q, role, status } = query;
  const filter = {};
  if (q) {
    filter.$text = { $search: q };
  }
  if (role) filter.role = role;
  if (status) filter.status = status;
  return filter;
}

// Stats for dashboard cards
exports.stats = async (_req, res) => {
  try {
    const [total, active, inactive, suspended, mfaEnabled, byRole] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ mfaEnabled: true }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    ]);
    const roles = byRole.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
    res.json({ total, active, inactive, suspended, mfaEnabled, roles });
  } catch (err) {
    console.error('stats error', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';

    const filter = buildFilter(req.query);
    console.log('[listUsers] user=', req.user?.email, 'role=', req.user?.role, 'filter=', filter, 'page=', page, 'limit=', limit, 'sort=', sort);
    const [items, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    console.log('[listUsers] total=', total, 'returned=', items.length);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('listUsers error', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, role, vessel, crewId, status, mfaEnabled, password, dob, extra, nationality, gender, phone, bloodGroup, emergency, address } = req.body;
    console.log('[createUser] by=', req.user?.email, 'creating=', { email, role, fullName });
    if (!fullName || !email || !role || !password) {
      return res.status(400).json({ message: 'fullName, email, role and password are required' });
    }
    // Basic validations
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ message: 'Invalid email' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (dob && new Date(dob) > new Date()) return res.status(400).json({ message: 'DOB cannot be in the future' });
    const bgList = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
    if (bloodGroup && !bgList.includes(bloodGroup)) return res.status(400).json({ message: 'Invalid blood group' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    let finalCrewId = crewId;
    if (!finalCrewId) {
      // Simple, readable auto ID: CRW-<base36 time>-<2char random>
      const rnd = Math.random().toString(36).slice(2, 4).toUpperCase();
      finalCrewId = `CRW-${Date.now().toString(36).toUpperCase()}-${rnd}`;
    }
    const doc = { fullName, email, role, vessel, crewId: finalCrewId, status, mfaEnabled, passwordHash };
    if (dob) doc.dob = new Date(dob);
    if (extra !== undefined) doc.extra = extra;
    if (nationality !== undefined) doc.nationality = nationality;
    if (gender !== undefined) doc.gender = gender;
    if (phone !== undefined) doc.phone = phone;
    if (bloodGroup !== undefined) doc.bloodGroup = bloodGroup;
    if (emergency && typeof emergency === 'object') doc.emergency = emergency;
    if (address && typeof address === 'object') doc.address = address;
    const user = await User.create(doc);
    console.log('[createUser] created id=', user?._id?.toString());
    res.status(201).json(user);
  } catch (err) {
    console.error('createUser error', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, vessel, status, mfaEnabled, password, dob, extra, nationality, gender, phone, bloodGroup, emergency, address } = req.body;

    const updates = { fullName, email, role, vessel, status, mfaEnabled };
    if (dob !== undefined) updates.dob = dob ? new Date(dob) : null;
    if (extra !== undefined) updates.extra = extra;
    if (nationality !== undefined) updates.nationality = nationality;
    if (gender !== undefined) updates.gender = gender;
    if (phone !== undefined) updates.phone = phone;
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup;
    if (emergency !== undefined) updates.emergency = emergency;
    if (address !== undefined) updates.address = address;
    // Remove undefined fields
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('updateUser error', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'inactive' | 'suspended'
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('setStatus error', err);
    res.status(500).json({ message: 'Failed to update status' });
  }
};

exports.setMFA = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const user = await User.findByIdAndUpdate(id, { mfaEnabled: !!enabled }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('setMFA error', err);
    res.status(500).json({ message: 'Failed to update MFA setting' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'newPassword is required' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(id, { passwordHash }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Password reset', id: user.id });
  } catch (err) {
    console.error('resetPassword error', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Backfill crewId for users missing it
exports.backfillCrewIds = async (_req, res) => {
  try {
    const toUpdate = await User.find({
      $or: [
        { crewId: { $exists: false } },
        { crewId: null },
        { crewId: '' },
      ],
    });

    let updated = 0;
    for (const u of toUpdate) {
      const rnd = Math.random().toString(36).slice(2, 4).toUpperCase();
      const newId = `CRW-${Date.now().toString(36).toUpperCase()}-${rnd}`;
      u.crewId = newId;
      await u.save();
      updated++;
    }

    res.json({ updated });
  } catch (err) {
    console.error('backfillCrewIds error', err);
    res.status(500).json({ message: 'Failed to backfill crew IDs' });
  }
};
