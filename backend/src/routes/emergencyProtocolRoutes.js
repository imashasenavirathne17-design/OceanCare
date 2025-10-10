const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/emergencyProtocolController');

// Public read for now; protect mutations
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

router.post('/', authenticate, ctrl.create);
router.patch('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
