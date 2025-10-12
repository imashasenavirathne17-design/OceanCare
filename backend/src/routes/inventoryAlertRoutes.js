const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/inventoryAlertController');

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole('health', 'admin', 'inventory'), ctrl.listAlerts);
router.get('/:id', requireRole('health', 'admin', 'inventory'), ctrl.getAlert);
router.post('/', requireRole('health', 'admin', 'inventory'), ctrl.createAlert);
router.put('/:id', requireRole('health', 'admin', 'inventory'), ctrl.updateAlert);
router.delete('/:id', requireRole('health', 'admin', 'inventory'), ctrl.deleteAlert);
router.post('/:id/acknowledge', requireRole('health', 'admin', 'inventory'), ctrl.acknowledgeAlert);
router.post('/:id/resolve', requireRole('health', 'admin', 'inventory'), ctrl.resolveAlert);

module.exports = router;
