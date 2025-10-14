const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const controller = require('../controllers/crewEmergencyAlertController');

const router = express.Router();

router.use(authenticate, requireRole('crew', 'emergency', 'health', 'admin'));

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
