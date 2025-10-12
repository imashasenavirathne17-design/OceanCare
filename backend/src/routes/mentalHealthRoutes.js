const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/mentalHealthController');

const router = express.Router();

const dest = path.join(process.cwd(), 'uploads', 'mental-health', 'sessions');
fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dest),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Observations
router.get('/observations', authenticate, ctrl.listObservations);
router.get('/observations/:id', authenticate, ctrl.getObservation);
router.post('/observations', authenticate, ctrl.createObservation);
router.put('/observations/:id', authenticate, ctrl.updateObservation);
router.delete('/observations/:id', authenticate, ctrl.deleteObservation);

// Sessions
router.get('/sessions', authenticate, ctrl.listSessions);
router.get('/sessions/:id', authenticate, ctrl.getSession);
router.post('/sessions', authenticate, upload.array('attachments', 5), ctrl.createSession);
router.put('/sessions/:id', authenticate, upload.array('attachments', 5), ctrl.updateSession);
router.delete('/sessions/:id', authenticate, ctrl.deleteSession);

// Summary
router.get('/summary', authenticate, ctrl.getDashboardSummary);

module.exports = router;
