const AuditLog = require('../models/AuditLog');

function normalizeStatus(status) {
  if (!status) return 'success';
  return ['success', 'failure'].includes(status) ? status : 'success';
}

function normalizeAction(action) {
  if (!action) return 'other';
  const allowed = ['create', 'update', 'delete', 'access', 'login', 'logout', 'export', 'other'];
  return allowed.includes(action) ? action : 'other';
}

async function logAuditEvent({
  resource,
  action,
  status,
  userId,
  userName,
  details,
  metadata,
  timestamp,
} = {}) {
  if (!resource) return null;
  const payload = {
    resource,
    action: normalizeAction(action),
    status: normalizeStatus(status),
    userId: userId || null,
    userName: userName || 'System',
    details: details || '',
    metadata: metadata || {},
    timestamp: timestamp ? new Date(timestamp) : new Date(),
  };

  try {
    const entry = await AuditLog.create(payload);
    return entry.toObject();
  } catch (err) {
    console.error('Audit log write failed:', err?.message || err);
    return null;
  }
}

module.exports = {
  logAuditEvent,
};
