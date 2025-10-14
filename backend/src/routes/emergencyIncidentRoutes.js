const express = require('express');
const controller = require('../controllers/emergencyIncidentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, controller.list);
router.get('/:id', authenticate, controller.getOne);
router.post('/', authenticate, controller.create);
router.put('/:id', authenticate, controller.update);
router.patch('/:id/resolve', authenticate, controller.resolve);
router.patch('/:id/timeline', authenticate, controller.appendTimeline);
router.patch('/:id/action-log', authenticate, controller.appendActionLog);
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
