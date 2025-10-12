const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/emergencyCrewController');

const router = express.Router();

router.use(authenticate, requireRole('emergency', 'admin', 'health'));

router.get('/', ctrl.listCrewProfiles);
router.get('/:id', ctrl.getCrewProfile);

module.exports = router;
