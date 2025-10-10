const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { listCrewMembers, createMedicalRecord, listMedicalRecords, getMedicalRecord, updateMedicalRecord, deleteMedicalRecord } = require('../controllers/healthController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer storage for medical records
const dest = path.join(process.cwd(), 'uploads', 'medical-records');
fs.mkdirSync(dest, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dest),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});
const upload = multer({ storage });

// Health officer utilities
router.get('/crew-members', authenticate, requireRole('health', 'admin'), listCrewMembers);

// Medical Records
router.get('/records', authenticate, requireRole('health', 'admin'), listMedicalRecords);
router.post('/records', authenticate, requireRole('health', 'admin'), upload.array('files', 10), createMedicalRecord);
router.get('/records/:id', authenticate, requireRole('health', 'admin'), getMedicalRecord);
router.put('/records/:id', authenticate, requireRole('health', 'admin'), upload.array('files', 10), updateMedicalRecord);
router.delete('/records/:id', authenticate, requireRole('health', 'admin'), deleteMedicalRecord);

module.exports = router;
