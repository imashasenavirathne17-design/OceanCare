require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const emergencyAlertRoutes = require('./routes/emergencyAlertRoutes');
const emergencyProtocolRoutes = require('./routes/emergencyProtocolRoutes');
const examinationRoutes = require('./routes/examinationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const chronicIllnessRoutes = require('./routes/chronicIllnessRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', time: new Date().toISOString() });
});

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/emergency-alerts', emergencyAlertRoutes);
  app.use('/api/emergency-protocols', emergencyProtocolRoutes);
  app.use('/api/health/exams', examinationRoutes);
  app.use('/api/health/chronic', chronicIllnessRoutes);
  app.use('/api/health', healthRoutes);

  const PORT = process.env.PORT || 5000;
  connectDB(process.env.MONGO_URI)
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB', err);
      process.exit(1);
    });
