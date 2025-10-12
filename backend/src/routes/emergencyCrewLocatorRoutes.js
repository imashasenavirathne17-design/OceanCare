const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/emergencyCrewLocatorController');

const router = express.Router();

router.use(authenticate, requireRole('emergency', 'admin', 'health'));

router.get('/', ctrl.listLocations);
router.put('/:crewId', ctrl.updateLocation);

module.exports = router;
