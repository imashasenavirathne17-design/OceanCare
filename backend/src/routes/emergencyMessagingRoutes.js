const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/emergencyMessagingController');

const router = express.Router();

router.use(authenticate, requireRole('emergency', 'admin', 'health'));

router.get('/contacts', ctrl.listContacts);
router.get('/messages', ctrl.listDashboardMessages);
router.get('/threads/:threadId', ctrl.listThreadMessages);
router.post('/threads', ctrl.sendMessage);
router.patch('/messages/:id/status', ctrl.updateMessageStatus);

module.exports = router;
