const mongoose = require('mongoose');
const HealthEducation = require('../models/HealthEducation');

const { Types } = mongoose;
const VALID_STATUS = ['draft', 'published', 'scheduled', 'archived'];

const toObjectId = (value) => {
  if (!value) return null;
  try {
    return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
  } catch (err) {
    return null;
  }
};

const sanitizeStatus = (value, fallback = 'draft') => {
  if (!value) return fallback;
  const normalized = String(value).toLowerCase();
  return VALID_STATUS.includes(normalized) ? normalized : fallback;
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const buildFilter = (query = {}) => {
  const filter = {};
  const { q, status, category, featured, createdBy, from, to, publishedOnly } = query;

  if (q) {
    const regex = { $regex: q, $options: 'i' };
    filter.$or = [
      { title: regex },
      { summary: regex },
      { content: regex },
      { tags: regex },
      { category: regex },
      { 'campaign.title': regex },
    ];
  }

  if (status && status !== 'all') {
    const normalizedStatus = sanitizeStatus(status, null);
    if (normalizedStatus) filter.status = normalizedStatus;
  }

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (featured === 'true') filter.featured = true;
  if (featured === 'false') filter.featured = false;

  if (publishedOnly === 'true') {
    filter.status = 'published';
  }

  const createdById = toObjectId(createdBy);
  if (createdById) filter.createdBy = createdById;

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (fromDate || toDate) {
    filter.publishDate = {};
    if (fromDate) filter.publishDate.$gte = fromDate;
    if (toDate) filter.publishDate.$lte = toDate;
    if (!Object.keys(filter.publishDate).length) delete filter.publishDate;
  }

  return filter;
};

exports.listEducation = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = limitParam && limitParam > 0 ? Math.min(limitParam, 100) : 20;
    const skip = (page - 1) * limit;

    const sortField = req.query.sort === 'views' ? 'metrics.views' : req.query.sort === 'likes' ? 'metrics.likes' : req.query.sort === 'recent' ? '-publishDate' : '-createdAt';
    const sort = typeof sortField === 'string' && sortField.startsWith('-') ? { [sortField.slice(1)]: -1 } : { [sortField]: 1 };
    if (sortField === '-publishDate') {
      sort.publishDate = -1;
      sort.createdAt = -1;
    }

    const [items, total, statusBreakdown, categoryBreakdown] = await Promise.all([
      HealthEducation.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthEducation.countDocuments(filter),
      HealthEducation.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      HealthEducation.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const statusSummary = VALID_STATUS.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {});
    statusBreakdown.forEach((entry) => {
      if (entry?._id && typeof entry.count === 'number') {
        statusSummary[entry._id] = entry.count;
      }
    });

    const categorySummary = categoryBreakdown.reduce((acc, entry) => {
      if (entry?._id && typeof entry.count === 'number') {
        acc[entry._id] = entry.count;
      }
      return acc;
    }, {});

    return res.json({
      items,
      total,
      page,
      pages: total ? Math.ceil(total / limit) : 0,
      summary: {
        total,
        statusSummary,
        categorySummary,
        featuredCount: items.filter((item) => item.featured).length,
      },
    });
  } catch (error) {
    console.error('List health education error:', error);
    return res.status(500).json({ message: 'Failed to list health education content' });
  }
};

exports.getEducation = async (req, res) => {
  try {
    const doc = await HealthEducation.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Content not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Get health education error:', error);
    return res.status(500).json({ message: 'Failed to fetch content' });
  }
};

exports.createEducation = async (req, res) => {
  try {
    const {
      title,
      category,
      summary,
      content,
      status,
      publishDate,
      scheduledAt,
      tags,
      featured,
      thumbnailUrl,
      attachments,
      icon,
      campaign,
    } = req.body;

    if (!title || !category || !summary || !content) {
      return res.status(400).json({ message: 'title, category, summary, and content are required' });
    }

    const payload = {
      title: String(title).trim(),
      category: String(category).trim(),
      summary: String(summary).trim(),
      content,
      status: sanitizeStatus(status, 'draft'),
      publishDate: parseDate(publishDate),
      scheduledAt: parseDate(scheduledAt),
      tags: normalizeTags(tags),
      featured: Boolean(featured),
      thumbnailUrl: thumbnailUrl ? String(thumbnailUrl).trim() : undefined,
      attachments: Array.isArray(attachments)
        ? attachments.map((a) => ({ label: a.label?.trim(), url: a.url?.trim() })).filter((a) => a.label || a.url)
        : undefined,
      icon: icon ? String(icon).trim() : undefined,
      campaign: campaign
        ? {
            title: campaign.title?.trim(),
            startDate: parseDate(campaign.startDate),
            endDate: parseDate(campaign.endDate),
            status: campaign.status?.trim(),
          }
        : undefined,
      createdBy: req.user?._id || null,
      createdByName: req.user?.fullName || req.user?.email || 'System',
      updatedBy: req.user?._id || null,
      updatedByName: req.user?.fullName || req.user?.email || 'System',
    };

    const doc = await HealthEducation.create(payload);
    return res.status(201).json(doc);
  } catch (error) {
    console.error('Create health education error:', error);
    return res.status(500).json({ message: 'Failed to create health education content' });
  }
};

exports.updateEducation = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.title) updates.title = String(updates.title).trim();
    if (updates.category) updates.category = String(updates.category).trim();
    if (updates.summary) updates.summary = String(updates.summary).trim();
    if (updates.status) updates.status = sanitizeStatus(updates.status, undefined);
    if (updates.publishDate) updates.publishDate = parseDate(updates.publishDate);
    if (updates.scheduledAt) updates.scheduledAt = parseDate(updates.scheduledAt);
    if (updates.tags) updates.tags = normalizeTags(updates.tags);
    if (typeof updates.featured !== 'undefined') updates.featured = Boolean(updates.featured);
    if (updates.thumbnailUrl) updates.thumbnailUrl = String(updates.thumbnailUrl).trim();
    if (updates.icon) updates.icon = String(updates.icon).trim();

    if (Array.isArray(updates.attachments)) {
      updates.attachments = updates.attachments
        .map((a) => ({ label: a.label?.trim(), url: a.url?.trim() }))
        .filter((a) => a.label || a.url);
    }

    if (updates.campaign) {
      updates.campaign = {
        title: updates.campaign.title?.trim(),
        startDate: parseDate(updates.campaign.startDate),
        endDate: parseDate(updates.campaign.endDate),
        status: updates.campaign.status?.trim(),
      };
    }

    updates.updatedBy = req.user?._id || null;
    updates.updatedByName = req.user?.fullName || req.user?.email || 'System';

    const doc = await HealthEducation.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Content not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Update health education error:', error);
    return res.status(500).json({ message: 'Failed to update health education content' });
  }
};

exports.deleteEducation = async (req, res) => {
  try {
    const doc = await HealthEducation.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Content not found' });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Delete health education error:', error);
    return res.status(500).json({ message: 'Failed to delete health education content' });
  }
};

exports.recordEngagement = async (req, res) => {
  try {
    const { views = 0, likes = 0, shares = 0 } = req.body || {};
    const doc = await HealthEducation.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          'metrics.views': Number(views) || 0,
          'metrics.likes': Number(likes) || 0,
          'metrics.shares': Number(shares) || 0,
        },
        updatedBy: req.user?._id || null,
        updatedByName: req.user?.fullName || req.user?.email || 'System',
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: 'Content not found' });
    return res.json(doc.metrics || {});
  } catch (error) {
    console.error('Record engagement error:', error);
    return res.status(500).json({ message: 'Failed to update engagement metrics' });
  }
};
