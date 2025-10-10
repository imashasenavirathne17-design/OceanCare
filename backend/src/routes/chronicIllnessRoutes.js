const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/chronicIllnessController');

const router = express.Router();

// Configure multer for file uploads
const dest = path.join(process.cwd(), 'uploads', 'chronic');
fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dest),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// ==================== CHRONIC ILLNESS PATIENT ROUTES ====================

// Get all patients with filters
router.get('/patients', authenticate, ctrl.listPatients);

// Get single patient details
router.get('/patients/:id', authenticate, ctrl.getPatient);

// Create new chronic illness patient
router.post('/patients', authenticate, upload.array('attachments', 5), ctrl.createPatient);

// Update patient record
router.put('/patients/:id', authenticate, upload.array('attachments', 5), ctrl.updatePatient);

// Delete patient from tracking
router.delete('/patients/:id', authenticate, ctrl.deletePatient);

// ==================== HEALTH READINGS ROUTES ====================

// Get all readings with filters
router.get('/readings', authenticate, ctrl.listReadings);

// Get single reading
router.get('/readings/:id', authenticate, ctrl.getReading);

// Create new health reading
router.post('/readings', authenticate, upload.array('attachments', 3), ctrl.createReading);

// Update reading
router.put('/readings/:id', authenticate, upload.array('attachments', 3), ctrl.updateReading);

// Delete reading
router.delete('/readings/:id', authenticate, ctrl.deleteReading);

// ==================== STATISTICS & REPORTS ROUTES ====================

// Get condition statistics
router.get('/stats/conditions', authenticate, ctrl.getConditionStats);

// Get progress tracking data
router.get('/stats/progress', authenticate, ctrl.getProgressData);

module.exports = router;
