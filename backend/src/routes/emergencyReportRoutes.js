const express = require('express');
const controller = require('../controllers/emergencyReportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, controller.list);
router.get('/:id', authenticate, controller.getOne);
router.post('/', authenticate, controller.create);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
