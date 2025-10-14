const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const JWT_EXPIRES_IN = '7d';

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.fullName,
      fullName: user.fullName,
      crewId: user.crewId || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, crewId } = req.body;
    console.log('[AUTH] Incoming register payload:', {
      hasFullName: !!fullName,
      emailPreview: typeof email === 'string' ? email.slice(0, 3) + '***' : typeof email,
      role,
      hasCrewId: !!crewId,
      // do not log password
    });
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const allowedRoles = ['crew', 'health', 'emergency', 'inventory', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const normEmail = String(email).toLowerCase().trim();
    console.log('[AUTH] Register attempt:', { email: normEmail, role });
    const existing = await User.findOne({ email: normEmail });
    if (existing) {
      console.log('[AUTH] Existing user found for email:', existing.email, 'id:', existing._id.toString());
    }
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ fullName, email: normEmail, passwordHash, role, crewId });
    console.log('[AUTH] Registered user id:', user._id.toString());

    return res.status(201).json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      crewId: user.crewId || null,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('Register error:', err?.message, err?.stack);
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    // Temporary: expose error message during development to diagnose issues
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ message: isDev ? `Server error: ${err?.message}` : 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        crewId: user.crewId || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
