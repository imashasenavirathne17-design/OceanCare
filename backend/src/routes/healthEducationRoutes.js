const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/healthEducationController');

const router = express.Router();

router.use(authenticate);
router.get('/', ctrl.listEducation);
router.get('/:id', ctrl.getEducation);
router.post('/', requireRole('health', 'admin', 'education'), ctrl.createEducation);
router.put('/:id', requireRole('health', 'admin', 'education'), ctrl.updateEducation);
router.delete('/:id', requireRole('health', 'admin', 'education'), ctrl.deleteEducation);
router.post('/:id/engagement', requireRole('health', 'admin', 'education'), ctrl.recordEngagement);

module.exports = router;
