const { CrewLocation } = require('../models/CrewLocation');
const { User } = require('../models/User');

function mapUserToLocation(user) {
  const extra = (() => {
    try {
      if (!user.extra) return {};
      if (typeof user.extra === 'object') return user.extra;
      const parsed = JSON.parse(user.extra);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      return {};
    }
  })();

  return {
    crewId: user.crewId || '',
    crewName: user.fullName,
    department: extra.department || extra.dept || '',
    role: extra.position || extra.role || 'Crew Member',
    status: 'offline',
    location: extra.lastLocation || 'Unknown',
    deck: extra.deck || 'Main Deck',
    position: { top: extra.positionTop || 50, left: extra.positionLeft || 50 },
    lastSeenAt: user.updatedAt || new Date(),
    notes: extra.notes || '',
  };
}

function buildStatus(locationDoc) {
  if (!locationDoc) return 'offline';
  return locationDoc.status || 'offline';
}

exports.listLocations = async (req, res) => {
  try {
    const crewUsers = await User.find({ role: 'crew' }).sort({ fullName: 1 }).lean();
    const locations = await CrewLocation.find({ crewId: { $in: crewUsers.map((u) => u.crewId).filter(Boolean) } }).lean();
    const locationMap = new Map();
    locations.forEach((loc) => {
      locationMap.set(loc.crewId, loc);
    });

    const data = crewUsers.map((user) => {
      const base = mapUserToLocation(user);
      const stored = user.crewId ? locationMap.get(user.crewId) : null;
      if (stored) {
        return {
          crewId: base.crewId,
          crewName: base.crewName,
          code: base.crewId,
          department: stored.department || base.department,
          role: stored.role || base.role,
          status: buildStatus(stored),
          location: stored.location || base.location,
          deck: stored.deck || base.deck,
          position: stored.position || base.position,
          lastSeenAt: stored.lastSeenAt || base.lastSeenAt,
          notes: stored.notes || base.notes,
        };
      }
      return {
        crewId: base.crewId,
        crewName: base.crewName,
        code: base.crewId,
        department: base.department,
        role: base.role,
        status: base.status,
        location: base.location,
        deck: base.deck,
        position: base.position,
        lastSeenAt: base.lastSeenAt,
        notes: base.notes,
      };
    });

    res.json(data);
  } catch (err) {
    console.error('listLocations error:', err);
    res.status(500).json({ message: 'Failed to load crew locations' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { crewId, crewName, department, role, status, location, deck, position, notes } = req.body;
    if (!crewId) {
      return res.status(400).json({ message: 'crewId is required' });
    }

    const payload = {
      crewId,
      crewName,
      department,
      role,
      status,
      location,
      deck,
      notes,
    };
    if (position && typeof position.top === 'number' && typeof position.left === 'number') {
      payload.position = position;
    }
    payload.lastSeenAt = req.body.lastSeenAt ? new Date(req.body.lastSeenAt) : new Date();

    const doc = await CrewLocation.findOneAndUpdate(
      { crewId },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(doc);
  } catch (err) {
    console.error('updateLocation error:', err);
    res.status(500).json({ message: 'Failed to update crew location' });
  }
};
