const { randomUUID } = require('crypto');
const { User } = require('../models/User');
const { MedicalRecord } = require('../models/MedicalRecord');

function parseExtra(extra) {
  if (!extra) return {};
  if (typeof extra === 'object') return { ...extra };
  try {
    const parsed = JSON.parse(extra);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
}

function encodeExtra(extra) {
  const value = extra && typeof extra === 'object' ? extra : {};
  return JSON.stringify(value);
}

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function compactAddress(address) {
  if (!address || typeof address !== 'object') return '';
  const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .map((part) => (part || '').trim())
    .filter(Boolean);
  return parts.join(', ');
}

function enrichMedicalRecord(record) {
  if (!record) return null;
  return {
    id: String(record._id),
    recordType: record.recordType || '',
    condition: record.condition || '',
    date: record.date || '',
    notes: record.notes || '',
    files: Array.isArray(record.files) ? record.files : [],
    status: record.status || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function normalizeAllergies(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function ensureContact(contact) {
  if (!contact || typeof contact !== 'object') return null;
  const id = contact.id || randomUUID();
  const name = (contact.name || '').trim();
  const relation = (contact.relation || '').trim();
  const phone = (contact.phone || '').trim();
  const email = (contact.email || '').trim();
  if (!name) return null;
  return { id, name, relation, phone, email };
}

async function buildProfilePayload(user, extra) {
  const profile = extra.crewProfile || {};
  const { firstName, lastName } = splitName(user.fullName || '');
  const personalStored = profile.personal || {};

  const crewId = user.crewId || '';
  let recordCount = 0;
  let latestRecord = null;
  let recentRecords = [];

  if (crewId) {
    recordCount = await MedicalRecord.countDocuments({ crewId });
    const records = await MedicalRecord.find({ crewId })
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .lean();
    if (records.length) {
      latestRecord = enrichMedicalRecord(records[0]);
      recentRecords = records.map(enrichMedicalRecord);
    }
  }

  const medicalStored = profile.medical || {};
  const settingsStored = profile.settings || {};
  const contactsStored = Array.isArray(profile.emergencyContacts) ? profile.emergencyContacts : [];
  const statsStored = profile.stats || {};

  const personal = {
    firstName: personalStored.firstName || firstName,
    lastName: personalStored.lastName || lastName,
    fullName: user.fullName || `${firstName} ${lastName}`.trim(),
    email: user.email,
    phone: user.phone || personalStored.phone || '',
    birthDate: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : personalStored.birthDate || '',
    nationality: user.nationality || personalStored.nationality || '',
    address: personalStored.address || compactAddress(user.address),
    vessel: user.vessel || '',
    crewId,
  };

  const medical = {
    bloodType: user.bloodGroup || medicalStored.bloodType || '',
    height: medicalStored.height ?? null,
    weight: medicalStored.weight ?? null,
    conditions: medicalStored.conditions || '',
    allergies: normalizeAllergies(medicalStored.allergies),
    allergyDetails: medicalStored.allergyDetails || '',
    medications: medicalStored.medications || '',
  };

  const emergencyContacts = contactsStored
    .map(ensureContact)
    .filter(Boolean);

  const settings = {
    notifications: Array.from(new Set(Array.isArray(settingsStored.notifications) ? settingsStored.notifications : ['email'])),
    language: settingsStored.language || 'en',
  };

  const stats = {
    healthChecks: statsStored.healthChecks ?? recordCount,
    vaccinations: statsStored.vaccinations ?? 0,
    compliance: statsStored.compliance ?? '100%',
  };

  return {
    personal,
    medical,
    emergencyContacts,
    settings,
    stats,
    timeline: {
      latestRecord,
      records: recentRecords,
    },
    meta: {
      updatedAt: user.updatedAt,
    },
  };
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user?.sub);
    if (!user || user.role !== 'crew') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const extra = parseExtra(user.extra);
    const payload = await buildProfilePayload(user, extra);
    return res.json(payload);
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ message: 'Failed to load crew profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user?.sub);
    if (!user || user.role !== 'crew') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const extra = parseExtra(user.extra);
    const profile = extra.crewProfile || {};

    const { personal, medical, emergencyContacts, settings, stats } = req.body || {};

    if (personal && typeof personal === 'object') {
      const firstName = (personal.firstName || '').trim();
      const lastName = (personal.lastName || '').trim();
      const email = (personal.email || '').trim();
      if (firstName || lastName) {
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) user.fullName = fullName;
        profile.personal = {
          ...(profile.personal || {}),
          firstName,
          lastName,
        };
      }
      if (email) user.email = email.toLowerCase();
      if (personal.phone !== undefined) {
        const phone = (personal.phone || '').trim();
        user.phone = phone;
        profile.personal = {
          ...(profile.personal || {}),
          phone,
        };
      }
      if (personal.birthDate !== undefined) {
        user.dob = personal.birthDate ? new Date(personal.birthDate) : null;
        profile.personal = {
          ...(profile.personal || {}),
          birthDate: personal.birthDate || '',
        };
      }
      if (personal.nationality !== undefined) {
        user.nationality = personal.nationality || '';
        profile.personal = {
          ...(profile.personal || {}),
          nationality: personal.nationality || '',
        };
      }
      if (personal.address !== undefined) {
        profile.personal = {
          ...(profile.personal || {}),
          address: personal.address || '',
        };
      }
      if (personal.vessel !== undefined) user.vessel = personal.vessel || '';
      if (personal.crewId !== undefined) user.crewId = personal.crewId || user.crewId;
    }

    if (medical && typeof medical === 'object') {
      const current = profile.medical || {};
      const height = medical.height !== undefined ? (medical.height === '' ? null : Number(medical.height)) : current.height ?? null;
      const weight = medical.weight !== undefined ? (medical.weight === '' ? null : Number(medical.weight)) : current.weight ?? null;
      profile.medical = {
        ...current,
        bloodType: medical.bloodType !== undefined ? medical.bloodType || '' : current.bloodType || '',
        height: Number.isNaN(height) ? current.height ?? null : height,
        weight: Number.isNaN(weight) ? current.weight ?? null : weight,
        conditions: medical.conditions !== undefined ? medical.conditions || '' : current.conditions || '',
        allergies: medical.allergies !== undefined ? normalizeAllergies(medical.allergies) : normalizeAllergies(current.allergies),
        allergyDetails: medical.allergyDetails !== undefined ? medical.allergyDetails || '' : current.allergyDetails || '',
        medications: medical.medications !== undefined ? medical.medications || '' : current.medications || '',
      };
      if (medical.bloodType !== undefined) user.bloodGroup = medical.bloodType || '';
    }

    if (Array.isArray(emergencyContacts)) {
      const sanitized = emergencyContacts
        .map(ensureContact)
        .filter(Boolean);
      profile.emergencyContacts = sanitized;
      if (sanitized.length) {
        user.emergency = {
          name: sanitized[0].name,
          phone: sanitized[0].phone,
          relation: sanitized[0].relation,
        };
      } else {
        user.emergency = undefined;
      }
    }

    if (settings && typeof settings === 'object') {
      const notifications = Array.isArray(settings.notifications)
        ? Array.from(new Set(settings.notifications.map((n) => String(n).trim()).filter(Boolean)))
        : undefined;
      profile.settings = {
        ...(profile.settings || {}),
        notifications: notifications || (profile.settings ? profile.settings.notifications : ['email']),
        language: settings.language || (profile.settings ? profile.settings.language : 'en'),
      };
    }

    if (stats && typeof stats === 'object') {
      profile.stats = {
        ...(profile.stats || {}),
        ...stats,
      };
    }

    extra.crewProfile = profile;
    user.extra = encodeExtra(extra);
    await user.save();

    const freshPayload = await buildProfilePayload(user, extra);
    return res.json(freshPayload);
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ message: 'Failed to update crew profile' });
  }
};
