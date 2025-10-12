const express = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/healthReportController');

const router = express.Router();

router.get('/', authenticate, controller.listReports);
router.post('/', authenticate, controller.createReport);
router.get('/stats', authenticate, controller.getReportStats);
router.get('/:id/export/pdf', authenticate, controller.exportReportPdf);
router.get('/:id/export/csv', authenticate, controller.exportReportCsv);
router.get('/:id', authenticate, controller.getReport);
router.put('/:id', authenticate, controller.updateReport);
router.delete('/:id', authenticate, controller.deleteReport);

module.exports = router;
