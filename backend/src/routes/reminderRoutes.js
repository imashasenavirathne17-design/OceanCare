const express = require('express');
const router = express.Router();
const {
  createReminder,
  listReminders,
  getReminder,
  updateReminder,
  deleteReminder,
  markCompleted,
  snoozeReminder,
  rescheduleReminder,
  getDashboardSummary,
  getReminderStats,
  bulkUpdateReminders,
  listMyReminders,
  createMyReminder,
  updateMyReminder,
  deleteMyReminder,
  markMyReminderCompleted,
  snoozeMyReminder,
  rescheduleMyReminder
} = require('../controllers/reminderController');
const { authenticate, requireRole } = require('../middleware/auth');

// Middleware for authentication (assuming you have auth middleware)
// const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

router.get('/my', requireRole('crew'), listMyReminders);
router.post('/my', requireRole('crew'), createMyReminder);
router.put('/my/:id', requireRole('crew'), updateMyReminder);
router.delete('/my/:id', requireRole('crew'), deleteMyReminder);
router.post('/my/:id/complete', requireRole('crew'), markMyReminderCompleted);
router.post('/my/:id/snooze', requireRole('crew'), snoozeMyReminder);
router.post('/my/:id/reschedule', requireRole('crew'), rescheduleMyReminder);

// ==================== BASIC CRUD ROUTES ====================

// GET /api/reminders - List all reminders with filters
router.get('/', requireRole('health', 'admin'), listReminders);

// POST /api/reminders - Create new reminder
router.post('/', requireRole('health', 'admin'), createReminder);

// GET /api/reminders/dashboard - Get dashboard summary
router.get('/dashboard', requireRole('health', 'admin'), getDashboardSummary);

// GET /api/reminders/stats - Get reminder statistics
router.get('/stats', requireRole('health', 'admin'), getReminderStats);

// POST /api/reminders/bulk-update - Bulk update reminders
router.post('/bulk-update', requireRole('health', 'admin'), bulkUpdateReminders);

// GET /api/reminders/:id - Get single reminder
router.get('/:id', requireRole('health', 'admin'), getReminder);

// PUT /api/reminders/:id - Update reminder
router.put('/:id', requireRole('health', 'admin'), updateReminder);

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', requireRole('health', 'admin'), deleteReminder);

// ==================== REMINDER ACTION ROUTES ====================

// POST /api/reminders/:id/complete - Mark reminder as completed
router.post('/:id/complete', requireRole('health', 'admin'), markCompleted);

// POST /api/reminders/:id/snooze - Snooze reminder
router.post('/:id/snooze', requireRole('health', 'admin'), snoozeReminder);

// POST /api/reminders/:id/reschedule - Reschedule reminder
router.post('/:id/reschedule', requireRole('health', 'admin'), rescheduleReminder);

module.exports = router;
