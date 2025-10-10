const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

const router = express.Router();

// All user management routes require auth (and ideally admin role; add role check if needed)
router.use(authenticate, requireRole('admin'));

router.get('/', ctrl.listUsers);
router.get('/stats', ctrl.stats);
router.post('/backfill-crewids', ctrl.backfillCrewIds);
router.post('/', ctrl.createUser);
router.patch('/:id', ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);
router.patch('/:id/status', ctrl.setStatus);
router.patch('/:id/mfa', ctrl.setMFA);
router.post('/:id/reset-password', ctrl.resetPassword);

module.exports = router;
