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
  bulkUpdateReminders
} = require('../controllers/reminderController');

// Middleware for authentication (assuming you have auth middleware)
// const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
// router.use(authenticateToken);

// ==================== BASIC CRUD ROUTES ====================

// GET /api/reminders - List all reminders with filters
router.get('/', listReminders);

// POST /api/reminders - Create new reminder
router.post('/', createReminder);

// GET /api/reminders/dashboard - Get dashboard summary
router.get('/dashboard', getDashboardSummary);

// GET /api/reminders/stats - Get reminder statistics
router.get('/stats', getReminderStats);

// POST /api/reminders/bulk-update - Bulk update reminders
router.post('/bulk-update', bulkUpdateReminders);

// GET /api/reminders/:id - Get single reminder
router.get('/:id', getReminder);

// PUT /api/reminders/:id - Update reminder
router.put('/:id', updateReminder);

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', deleteReminder);

// ==================== REMINDER ACTION ROUTES ====================

// POST /api/reminders/:id/complete - Mark reminder as completed
router.post('/:id/complete', markCompleted);

// POST /api/reminders/:id/snooze - Snooze reminder
router.post('/:id/snooze', snoozeReminder);

// POST /api/reminders/:id/reschedule - Reschedule reminder
router.post('/:id/reschedule', rescheduleReminder);

module.exports = router;
