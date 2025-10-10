const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/examinationController');

const router = express.Router();

// Multer storage
const dest = path.join(process.cwd(), 'uploads', 'exams');
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

// Routes
router.get('/', authenticate, ctrl.listExams);
router.get('/my', authenticate, ctrl.listMyExams);
router.get('/:id', authenticate, ctrl.getExam);
router.post('/', authenticate, upload.array('files', 10), ctrl.createExam);
router.put('/:id', authenticate, upload.array('files', 10), ctrl.updateExam);
router.delete('/:id', authenticate, ctrl.deleteExam);

module.exports = router;
