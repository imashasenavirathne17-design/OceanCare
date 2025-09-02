const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Dummy stats — you can replace with actual DB queries later
router.get('/', protect, authorize('HEALTH_OFFICER'), (req, res) => {
  res.json({
    pendingExams: 5,
    chronicPatients: 12,
    vaccinationAlerts: 3
  });
});

module.exports = router;
