const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/crewMedicalRecordController');

const router = express.Router();

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

router.get('/', authenticate, ctrl.listMyRecords);
router.get('/:id', authenticate, ctrl.getMyRecord);
router.post('/', authenticate, upload.array('files', 10), ctrl.createMyRecord);
router.put('/:id', authenticate, upload.array('files', 10), ctrl.updateMyRecord);
router.delete('/:id', authenticate, ctrl.deleteMyRecord);

module.exports = router;
