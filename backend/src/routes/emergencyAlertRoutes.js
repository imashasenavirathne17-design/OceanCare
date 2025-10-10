const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/emergencyAlertController');

// Public read for now; protect mutations
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

router.post('/', authenticate, ctrl.create);
router.patch('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.remove);

router.post('/:id/ack', authenticate, ctrl.acknowledge);
router.post('/:id/resolve', authenticate, ctrl.resolve);

module.exports = router;
