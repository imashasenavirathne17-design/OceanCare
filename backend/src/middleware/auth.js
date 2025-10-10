const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  const r = (req.user && req.user.role) || '';
  if (!roles.includes(r)) return res.status(403).json({ message: 'Forbidden' });
  return next();
};
