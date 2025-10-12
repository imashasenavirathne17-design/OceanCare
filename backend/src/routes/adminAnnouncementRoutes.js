const express = require('express');
const router = express.Router();
const {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  restoreAnnouncement,
  acknowledgeAnnouncement
} = require('../controllers/adminAnnouncementController');

// Uncomment when auth middleware is available
// const { authenticateToken, authorizeRoles } = require('../middleware/auth');
// router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', listAnnouncements);
router.post('/', createAnnouncement);
router.get('/:id', getAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);
router.post('/:id/publish', publishAnnouncement);
router.post('/:id/archive', archiveAnnouncement);
router.post('/:id/restore', restoreAnnouncement);
router.post('/:id/acknowledge', acknowledgeAnnouncement);

module.exports = router;
