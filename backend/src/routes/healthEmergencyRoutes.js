const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/healthEmergencyController');

const router = express.Router();

router.use(authenticate);
router.get('/', requireRole('health', 'admin', 'emergency'), ctrl.listEmergencies);
router.get('/:id', requireRole('health', 'admin', 'emergency'), ctrl.getEmergency);
router.post('/', requireRole('health', 'admin', 'emergency'), ctrl.createEmergency);
router.put('/:id', requireRole('health', 'admin', 'emergency'), ctrl.updateEmergency);
router.delete('/:id', requireRole('health', 'admin', 'emergency'), ctrl.deleteEmergency);
router.post('/:id/acknowledge', requireRole('health', 'admin', 'emergency'), ctrl.acknowledgeEmergency);
router.post('/:id/resolve', requireRole('health', 'admin', 'emergency'), ctrl.resolveEmergency);

module.exports = router;
