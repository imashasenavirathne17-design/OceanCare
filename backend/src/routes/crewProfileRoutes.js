const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/crewProfileController');

const router = express.Router();

router.use(authenticate, requireRole('crew'));

router.get('/', ctrl.getProfile);
router.put('/', ctrl.updateProfile);
router.patch('/', ctrl.updateProfile);

module.exports = router;
