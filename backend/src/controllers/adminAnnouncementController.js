const AdminAnnouncement = require('../models/AdminAnnouncement');

// Utility to build search filters
const buildFilters = (query = {}) => {
  const {
    q,
    status,
    priority,
    audience,
    from,
    to,
    withAttachments,
    acknowledgementRequired
  } = query;

  const filter = {};

  if (q) {
    filter.$text = { $search: q };
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (priority && priority !== 'all') {
    filter.priority = priority;
  }

  if (audience && audience !== 'all') {
    filter.audience = audience;
  }

  if (from || to) {
    filter.publishAt = {};
    if (from) filter.publishAt.$gte = new Date(from);
    if (to) filter.publishAt.$lte = new Date(to);
  }

  if (withAttachments === 'true') {
    filter.attachments = { $exists: true, $ne: [] };
  }

  if (acknowledgementRequired === 'true') {
    filter.acknowledgementRequired = true;
  }

  return filter;
};

exports.listAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-publishAt' } = req.query;
    const filter = buildFilters(req.query);

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [announcements, total] = await Promise.all([
      AdminAnnouncement.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      AdminAnnouncement.countDocuments(filter)
    ]);

    return res.json({
      announcements,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('List admin announcements error:', error);
    return res.status(500).json({ message: 'Failed to fetch admin announcements' });
  }
};

exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await AdminAnnouncement.findById(req.params.id).lean();

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.json(announcement);
  } catch (error) {
    console.error('Get admin announcement error:', error);
    return res.status(500).json({ message: 'Failed to fetch announcement' });
  }
};

const sanitizePayload = (data = {}) => {
  const safe = { ...data };

  if (safe.tags) {
    if (Array.isArray(safe.tags)) {
      safe.tags = safe.tags.filter(Boolean);
    } else if (typeof safe.tags === 'string') {
      safe.tags = safe.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    } else {
      safe.tags = [];
    }
  }

  if (safe.audience) {
    if (Array.isArray(safe.audience)) {
      safe.audience = safe.audience.filter(Boolean);
    } else if (typeof safe.audience === 'string') {
      safe.audience = safe.audience.split(',').map((group) => group.trim()).filter(Boolean);
    } else {
      safe.audience = ['all'];
    }
  }

  if (safe.publishAt) safe.publishAt = new Date(safe.publishAt);
  if (safe.expiresAt) safe.expiresAt = new Date(safe.expiresAt);
  if (safe.acknowledgementDue) safe.acknowledgementDue = new Date(safe.acknowledgementDue);

  return safe;
};

exports.createAnnouncement = async (req, res) => {
  try {
    if (!req.body?.title || !req.body?.message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const payload = sanitizePayload(req.body);

    const announcement = await AdminAnnouncement.create({
      ...payload,
      createdBy: req.user?.id || null,
      createdByName: req.user?.fullName || 'Administrator'
    });

    return res.status(201).json(announcement.toObject());
  } catch (error) {
    console.error('Create admin announcement error:', error);
    return res.status(500).json({ message: error?.message || 'Failed to create admin announcement' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const updates = {
      ...sanitizePayload(req.body),
      updatedBy: req.user?.id || null,
      updatedByName: req.user?.fullName || 'Administrator'
    };

    const announcement = await AdminAnnouncement.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.json(announcement);
  } catch (error) {
    console.error('Update admin announcement error:', error);
    return res.status(500).json({ message: 'Failed to update admin announcement' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await AdminAnnouncement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete admin announcement error:', error);
    return res.status(500).json({ message: 'Failed to delete admin announcement' });
  }
};

exports.publishAnnouncement = async (req, res) => {
  try {
    const announcement = await AdminAnnouncement.findByIdAndUpdate(
      req.params.id,
      {
        status: 'published',
        publishAt: req.body.publishAt ? new Date(req.body.publishAt) : new Date(),
        updatedBy: req.user?.id || null,
        updatedByName: req.user?.fullName || 'Administrator'
      },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.json(announcement);
  } catch (error) {
    console.error('Publish admin announcement error:', error);
    return res.status(500).json({ message: 'Failed to publish admin announcement' });
  }
};

exports.archiveAnnouncement = async (req, res) => {
  try {
    const announcement = await AdminAnnouncement.findByIdAndUpdate(
      req.params.id,
      {
        status: 'archived',
        archivedAt: new Date(),
        archivedBy: req.user?.id || null,
        updatedBy: req.user?.id || null,
        updatedByName: req.user?.fullName || 'Administrator'
      },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.json(announcement);
  } catch (error) {
    console.error('Archive admin announcement error:', error);
    return res.status(500).json({ message: 'Failed to archive admin announcement' });
  }
};

exports.restoreAnnouncement = async (req, res) => {
  try {
    const announcement = await AdminAnnouncement.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status || 'draft',
        archivedAt: null,
        archivedBy: null,
        updatedBy: req.user?.id || null,
        updatedByName: req.user?.fullName || 'Administrator'
      },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.json(announcement);
  } catch (error) {
    console.error('Restore admin announcement error:', error);
    return res.status(500).json({ message: 'Failed to restore admin announcement' });
  }
};

exports.acknowledgeAnnouncement = async (req, res) => {
  try {
    const { notes } = req.body;

    const announcement = await AdminAnnouncement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const ack = {
      userId: req.user?.id || null,
      acknowledgedAt: new Date(),
      notes
    };

    announcement.acknowledgedBy.push(ack);
    await announcement.save();

    return res.json({ success: true, acknowledgement: ack });
  } catch (error) {
    console.error('Acknowledge admin announcement error:', error);
    return res.status(500).json({ message: 'Failed to acknowledge announcement' });
  }
};
