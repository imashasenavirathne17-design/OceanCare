const { User, roles } = require('../models/User');

// GET /api/admin/roles
exports.listRoles = async (_req, res) => {
  try {
    res.json({ roles });
  } catch (err) {
    console.error('listRoles error', err);
    res.status(500).json({ message: 'Failed to load roles' });
  }
};

// GET /api/admin/admins
exports.listAdmins = async (_req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id fullName email role status createdAt');
    res.json({ items: admins, total: admins.length });
  } catch (err) {
    console.error('listAdmins error', err);
    res.status(500).json({ message: 'Failed to load admins' });
  }
};

// PATCH /api/admin/users/:id/role { role }
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !roles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent self-demotion for safety
    if (req.user?.sub === id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If demoting an admin, make sure there is at least one other admin remaining
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last admin' });
      }
    }

    user.role = role;
    await user.save();
    res.json({ id: user._id, role: user.role });
  } catch (err) {
    console.error('changeUserRole error', err);
    res.status(500).json({ message: 'Failed to change user role' });
  }
};
