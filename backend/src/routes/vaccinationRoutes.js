const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/vaccinationController');

const router = express.Router();

router.get('/', authenticate, requireRole('health', 'admin'), ctrl.listVaccinations);
router.get('/:id', authenticate, requireRole('health', 'admin'), ctrl.getVaccination);
router.post('/', authenticate, requireRole('health', 'admin'), ctrl.createVaccination);
router.put('/:id', authenticate, requireRole('health', 'admin'), ctrl.updateVaccination);
router.delete('/:id', authenticate, requireRole('health', 'admin'), ctrl.deleteVaccination);
router.post('/:id/complete', authenticate, requireRole('health', 'admin'), ctrl.markComplete);

module.exports = router;
