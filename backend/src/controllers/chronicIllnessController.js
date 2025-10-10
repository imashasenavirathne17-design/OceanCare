const ChronicIllness = require('../models/ChronicIllness');
const ChronicReading = require('../models/ChronicReading');
const User = require('../models/User');

// ==================== CHRONIC ILLNESS CRUD ====================

// Create new chronic illness patient
exports.createPatient = async (req, res) => {
  try {
    const {
      crewId,
      crewName,
      conditions,
      primaryCondition,
      severity,
      diagnosisDate,
      status,
      nextCheckup,
      initialFindings,
      treatmentPlan,
      monitoringParameters,
      medications
    } = req.body;

    // Check if patient already exists
    const existingPatient = await ChronicIllness.findOne({ crewId });
    if (existingPatient) {
      return res.status(400).json({ 
        message: 'Patient with this crew ID already exists in chronic illness tracking' 
      });
    }

    const patient = await ChronicIllness.create({
      crewId,
      crewName,
      conditions: Array.isArray(conditions) ? conditions : [conditions],
      primaryCondition,
      severity: severity || 'moderate',
      diagnosisDate: new Date(diagnosisDate),
      status: status || 'stable',
      nextCheckup: nextCheckup ? new Date(nextCheckup) : null,
      initialFindings,
      treatmentPlan,
      monitoringParameters,
      medications: medications || [],
      treatmentHistory: [{
        date: new Date(),
        description: 'Patient added to chronic illness tracking',
        performedBy: req.user?.fullName || 'Health Officer'
      }],
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null
    });

    return res.status(201).json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    return res.status(500).json({ message: 'Failed to create patient record' });
  }
};

// Get all chronic illness patients with filters
exports.listPatients = async (req, res) => {
  try {
    const { q, condition, status, severity, from, to } = req.query;
    const filter = {};

    // Search query
    if (q) {
      filter.$or = [
        { crewId: { $regex: q, $options: 'i' } },
        { crewName: { $regex: q, $options: 'i' } },
        { conditions: { $regex: q, $options: 'i' } },
        { primaryCondition: { $regex: q, $options: 'i' } }
      ];
    }

    // Condition filter
    if (condition && condition !== 'All Conditions') {
      filter.conditions = { $regex: condition, $options: 'i' };
    }

    // Status filter
    if (status && status !== 'All Status') {
      const statusMap = {
        'Stable': 'stable',
        'Needs Review': 'warning',
        'Critical': 'critical'
      };
      filter.status = statusMap[status] || status.toLowerCase();
    }

    // Severity filter
    if (severity) {
      filter.severity = severity.toLowerCase();
    }

    // Date range filter
    if (from || to) {
      filter.diagnosisDate = {};
      if (from) filter.diagnosisDate.$gte = new Date(from);
      if (to) filter.diagnosisDate.$lte = new Date(to);
    }

    const patients = await ChronicIllness.find(filter)
      .sort({ status: -1, nextCheckup: 1 })
      .lean();

    return res.json(patients);
  } catch (error) {
    console.error('List patients error:', error);
    return res.status(500).json({ message: 'Failed to list patients' });
  }
};

// Get single patient details
exports.getPatient = async (req, res) => {
  try {
    const patient = await ChronicIllness.findById(req.params.id)
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get recent readings for this patient
    const recentReadings = await ChronicReading.find({ patientId: patient._id })
      .sort({ readingDate: -1 })
      .limit(10)
      .lean();

    return res.json({
      patient,
      recentReadings
    });
  } catch (error) {
    console.error('Get patient error:', error);
    return res.status(500).json({ message: 'Failed to get patient details' });
  }
};

// Update patient record
exports.updatePatient = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Convert dates if provided
    if (updates.diagnosisDate) updates.diagnosisDate = new Date(updates.diagnosisDate);
    if (updates.nextCheckup) updates.nextCheckup = new Date(updates.nextCheckup);
    
    // Ensure conditions is an array
    if (updates.conditions && !Array.isArray(updates.conditions)) {
      updates.conditions = [updates.conditions];
    }

    // Add update tracking
    updates.updatedBy = req.user?.id || null;

    // Add to treatment history if status changed
    const existingPatient = await ChronicIllness.findById(req.params.id);
    if (existingPatient && updates.status && existingPatient.status !== updates.status) {
      const historyEntry = {
        date: new Date(),
        description: `Status changed from ${existingPatient.status} to ${updates.status}`,
        performedBy: req.user?.fullName || 'Health Officer'
      };
      
      updates.$push = { treatmentHistory: historyEntry };
    }

    const patient = await ChronicIllness.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json(patient);
  } catch (error) {
    console.error('Update patient error:', error);
    return res.status(500).json({ message: 'Failed to update patient record' });
  }
};

// Delete patient from chronic illness tracking
exports.deletePatient = async (req, res) => {
  try {
    const patient = await ChronicIllness.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Also delete all readings for this patient
    await ChronicReading.deleteMany({ patientId: req.params.id });

    return res.json({ 
      success: true, 
      message: 'Patient removed from chronic illness tracking' 
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    return res.status(500).json({ message: 'Failed to delete patient record' });
  }
};

// ==================== CHRONIC READINGS CRUD ====================

// Create new health reading
exports.createReading = async (req, res) => {
  try {
    const {
      patientId,
      crewId,
      readingDate,
      bloodGlucose,
      bloodPressure,
      peakFlow,
      weight,
      temperature,
      heartRate,
      oxygenSaturation,
      symptoms,
      medicationAdherence,
      clinicalNotes,
      followUpRequired
    } = req.body;

    // Validate patient exists
    const patient = await ChronicIllness.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Determine alert level based on vitals
    let alertLevel = 'normal';
    
    // Simple alert logic (can be enhanced)
    if (bloodGlucose) {
      const glucose = parseFloat(bloodGlucose);
      if (glucose > 200 || glucose < 70) alertLevel = 'urgent';
      else if (glucose > 180 || glucose < 80) alertLevel = 'attention';
    }
    
    if (bloodPressure) {
      const [systolic, diastolic] = bloodPressure.split('/').map(Number);
      if (systolic > 180 || diastolic > 120) alertLevel = 'urgent';
      else if (systolic > 140 || diastolic > 90) {
        alertLevel = alertLevel === 'urgent' ? 'urgent' : 'attention';
      }
    }

    const reading = await ChronicReading.create({
      patientId,
      crewId: crewId || patient.crewId,
      readingDate: new Date(readingDate),
      vitals: {
        bloodGlucose,
        bloodPressure,
        peakFlow,
        weight,
        temperature,
        heartRate,
        oxygenSaturation
      },
      symptoms: symptoms || [],
      medicationAdherence: medicationAdherence || 'not_applicable',
      clinicalNotes,
      alertLevel,
      followUpRequired: followUpRequired || false,
      recordedBy: req.user?.id || null,
      recordedByName: req.user?.fullName || 'Health Officer'
    });

    // Update patient's last reading
    await ChronicIllness.findByIdAndUpdate(patientId, {
      lastReading: {
        date: reading.readingDate,
        bloodGlucose,
        bloodPressure,
        peakFlow,
        weight,
        notes: clinicalNotes
      },
      // Update status based on alert level
      status: alertLevel === 'urgent' ? 'critical' : 
              alertLevel === 'attention' ? 'warning' : 
              'stable',
      updatedBy: req.user?.id || null
    });

    return res.status(201).json(reading);
  } catch (error) {
    console.error('Create reading error:', error);
    return res.status(500).json({ message: 'Failed to create health reading' });
  }
};

// Get readings for a patient
exports.listReadings = async (req, res) => {
  try {
    const { patientId, crewId, from, to, alertLevel } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (crewId) filter.crewId = crewId;
    if (alertLevel) filter.alertLevel = alertLevel;

    // Date range filter
    if (from || to) {
      filter.readingDate = {};
      if (from) filter.readingDate.$gte = new Date(from);
      if (to) filter.readingDate.$lte = new Date(to);
    }

    const readings = await ChronicReading.find(filter)
      .populate('patientId', 'crewName conditions')
      .sort({ readingDate: -1 })
      .lean();

    return res.json(readings);
  } catch (error) {
    console.error('List readings error:', error);
    return res.status(500).json({ message: 'Failed to list readings' });
  }
};

// Get single reading
exports.getReading = async (req, res) => {
  try {
    const reading = await ChronicReading.findById(req.params.id)
      .populate('patientId', 'crewName conditions severity')
      .populate('recordedBy', 'fullName');
    
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    return res.json(reading);
  } catch (error) {
    console.error('Get reading error:', error);
    return res.status(500).json({ message: 'Failed to get reading' });
  }
};

// Update reading
exports.updateReading = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    if (updates.readingDate) updates.readingDate = new Date(updates.readingDate);

    const reading = await ChronicReading.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    return res.json(reading);
  } catch (error) {
    console.error('Update reading error:', error);
    return res.status(500).json({ message: 'Failed to update reading' });
  }
};

// Delete reading
exports.deleteReading = async (req, res) => {
  try {
    const reading = await ChronicReading.findByIdAndDelete(req.params.id);
    
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    return res.json({ 
      success: true, 
      message: 'Reading deleted successfully' 
    });
  } catch (error) {
    console.error('Delete reading error:', error);
    return res.status(500).json({ message: 'Failed to delete reading' });
  }
};

// ==================== STATISTICS & REPORTS ====================

// Get condition statistics
exports.getConditionStats = async (req, res) => {
  try {
    const stats = await ChronicIllness.aggregate([
      {
        $group: {
          _id: '$primaryCondition',
          total: { $sum: 1 },
          stable: {
            $sum: { $cond: [{ $eq: ['$status', 'stable'] }, 1, 0] }
          },
          warning: {
            $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] }
          },
          critical: {
            $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] }
          },
          severityBreakdown: {
            $push: '$severity'
          }
        }
      },
      {
        $project: {
          condition: '$_id',
          total: 1,
          stable: 1,
          warning: 1,
          critical: 1,
          severityBreakdown: 1
        }
      }
    ]);

    return res.json(stats);
  } catch (error) {
    console.error('Get condition stats error:', error);
    return res.status(500).json({ message: 'Failed to get condition statistics' });
  }
};

// Get progress tracking data
exports.getProgressData = async (req, res) => {
  try {
    const { patientId, days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filter = {
      readingDate: { $gte: startDate }
    };
    
    if (patientId) filter.patientId = patientId;

    const readings = await ChronicReading.find(filter)
      .populate('patientId', 'crewName conditions')
      .sort({ readingDate: 1 })
      .lean();

    // Group readings by patient for progress tracking
    const progressData = {};
    readings.forEach(reading => {
      const patientKey = reading.patientId._id.toString();
      if (!progressData[patientKey]) {
        progressData[patientKey] = {
          patientName: reading.patientId.crewName,
          conditions: reading.patientId.conditions,
          readings: []
        };
      }
      progressData[patientKey].readings.push({
        date: reading.readingDate,
        vitals: reading.vitals,
        alertLevel: reading.alertLevel
      });
    });

    return res.json(progressData);
  } catch (error) {
    console.error('Get progress data error:', error);
    return res.status(500).json({ message: 'Failed to get progress data' });
  }
};
