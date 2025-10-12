const { User } = require('../models/User');
const { MedicalRecord } = require('../models/MedicalRecord');

function parseExtra(extra) {
  if (!extra) return {};
  if (typeof extra === 'object') return extra;
  try {
    const parsed = JSON.parse(extra);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (err) {}
  return { notes: String(extra) };
}

function computeRisk(latestRecord) {
  if (!latestRecord) return 'stable';
  const base = `${latestRecord.condition || ''} ${latestRecord.recordType || ''}`.toLowerCase();
  if (!base.trim()) return 'stable';
  if (/(cardiac|heart|hypertension|critical|stroke|seizure)/.test(base)) return 'critical';
  if (/(respir|asthma|injury|infection|diabetes|chronic|monitor)/.test(base)) return 'elevated';
  return 'stable';
}

function formatRecord(record) {
  if (!record) return null;
  return {
    id: record._id,
    crewId: record.crewId,
    recordType: record.recordType,
    condition: record.condition,
    date: record.date,
    notes: record.notes,
    files: record.files,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function buildRecordSummary(crewIds) {
  if (!crewIds.length) return {};
  const summaries = await MedicalRecord.aggregate([
    { $match: { crewId: { $in: crewIds } } },
    { $sort: { date: -1, createdAt: -1 } },
    {
      $group: {
        _id: '$crewId',
        latest: { $first: '$$ROOT' },
        count: { $sum: 1 },
      },
    },
  ]);
  const map = {};
  summaries.forEach((item) => {
    map[item._id] = {
      latest: formatRecord(item.latest),
      count: item.count,
    };
  });
  return map;
}

exports.listCrewProfiles = async (req, res) => {
  try {
    const { q = '', risk = 'all', status = 'all' } = req.query;
    const filter = { role: 'crew' };
    if (status !== 'all') filter.status = status;
    if (q.trim()) {
      const pattern = new RegExp(q.trim(), 'i');
      filter.$or = [
        { fullName: pattern },
        { email: pattern },
        { crewId: pattern },
        { phone: pattern },
      ];
    }
    const crew = await User.find(filter)
      .sort({ fullName: 1 })
      .lean();
    const crewIds = crew.map((c) => c.crewId).filter(Boolean);
    const recordSummary = await buildRecordSummary(crewIds);
    const data = crew.map((c) => {
      const extra = parseExtra(c.extra);
      const latest = c.crewId ? recordSummary[c.crewId]?.latest : null;
      const recordCount = c.crewId ? recordSummary[c.crewId]?.count || 0 : 0;
      const riskLevel = computeRisk(latest);
      return {
        id: String(c._id),
        fullName: c.fullName,
        crewId: c.crewId || '',
        email: c.email,
        phone: c.phone || '',
        vessel: c.vessel || '',
        status: c.status,
        bloodGroup: c.bloodGroup || '',
        emergencyContact: c.emergency || null,
        department: extra.department || extra.dept || '',
        position: extra.position || extra.role || extra.notes || '',
        riskLevel,
        latestRecord: latest,
        recordCount,
      };
    });
    const filtered = data.filter((item) => (risk === 'all' ? true : item.riskLevel === risk));
    res.json(filtered);
  } catch (err) {
    console.error('listCrewProfiles error:', err);
    res.status(500).json({ message: 'Failed to load crew profiles' });
  }
};

exports.getCrewProfile = async (req, res) => {
  try {
    const { id } = req.params;
    let crewUser = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      crewUser = await User.findOne({ _id: id, role: 'crew' }).lean();
    }
    if (!crewUser) {
      crewUser = await User.findOne({ crewId: id, role: 'crew' }).lean();
    }
    if (!crewUser) {
      return res.status(404).json({ message: 'Crew member not found' });
    }
    const extra = parseExtra(crewUser.extra);
    const records = await MedicalRecord.find({ crewId: crewUser.crewId })
      .sort({ date: -1, createdAt: -1 })
      .limit(50)
      .lean();
    const formattedRecords = records.map(formatRecord);
    const latestRecord = formattedRecords[0] || null;
    const riskLevel = computeRisk(latestRecord);
    const age = crewUser.dob ? Math.max(0, Math.floor((Date.now() - new Date(crewUser.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : null;

    const personal = {
      fullName: crewUser.fullName,
      crewId: crewUser.crewId || '',
      email: crewUser.email,
      phone: crewUser.phone || '',
      vessel: crewUser.vessel || '',
      status: crewUser.status,
      role: extra.position || extra.role || 'Crew Member',
      department: extra.department || extra.dept || '',
      age,
      nationality: crewUser.nationality || '',
      gender: crewUser.gender || '',
    };

    const medical = {
      bloodGroup: crewUser.bloodGroup || 'Unknown',
      riskLevel,
      emergencyContact: crewUser.emergency || null,
      recordCount: formattedRecords.length,
      latestRecord,
    };

    res.json({
      id: String(crewUser._id),
      personal,
      medical,
      timeline: {
        records: formattedRecords,
      },
    });
  } catch (err) {
    console.error('getCrewProfile error:', err);
    res.status(500).json({ message: 'Failed to load crew profile' });
  }
};
