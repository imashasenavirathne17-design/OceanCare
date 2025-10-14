const Reminder = require('../models/Reminder');
const User = require('../models/User');

// ==================== REMINDER CRUD ====================

// Create new reminder
exports.createReminder = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      crewId,
      crewName,
      scheduledDate,
      scheduledTime,
      medication,
      followup,
      isRecurring,
      recurrencePattern,
      recurrenceEnd,
      alertSettings,
      notes,
      tags
    } = req.body;

    // Validate required fields based on type
    if (type === 'medication' && (!medication || !medication.name)) {
      return res.status(400).json({ 
        message: 'Medication name is required for medication reminders' 
      });
    }

    if (type === 'followup' && (!followup || !followup.followupType)) {
      return res.status(400).json({ 
        message: 'Follow-up type is required for follow-up reminders' 
      });
    }

    const reminder = await Reminder.create({
      type,
      title,
      description,
      crewId,
      crewName,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      medication: type === 'medication' ? medication : undefined,
      followup: type === 'followup' ? {
        ...followup,
        nextDueDate: followup.nextDueDate ? new Date(followup.nextDueDate) : undefined,
        lastCheckDate: followup.lastCheckDate ? new Date(followup.lastCheckDate) : undefined
      } : undefined,
      isRecurring: isRecurring || false,
      recurrencePattern,
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : undefined,
      alertSettings: alertSettings || {
        enabled: true,
        leadTime: 30,
        methods: ['dashboard']
      },
      notes,
      tags: tags || [],
      createdBy: req.user?.id || null,
      createdByName: req.user?.fullName || 'Health Officer'
    });

    return res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    return res.status(500).json({ message: 'Failed to create reminder' });
  }
};

// Get all reminders with filters
exports.listReminders = async (req, res) => {
  try {
    const { 
      q, 
      type, 
      status, 
      crewId, 
      from, 
      to, 
      priority,
      overdue,
      today,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    // Search query
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { crewName: { $regex: q, $options: 'i' } },
        { crewId: { $regex: q, $options: 'i' } },
        { 'medication.name': { $regex: q, $options: 'i' } },
        { 'followup.followupType': { $regex: q, $options: 'i' } }
      ];
    }

    // Type filter
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        filter.status = { $in: ['scheduled', 'pending'] };
      } else {
        filter.status = status;
      }
    }

    // Crew member filter
    if (crewId) {
      filter.crewId = crewId;
    }

    // Priority filter (for follow-ups)
    if (priority) {
      filter['followup.priority'] = priority;
    }

    // Date range filter
    if (from || to) {
      filter.scheduledDate = {};
      if (from) filter.scheduledDate.$gte = new Date(from);
      if (to) filter.scheduledDate.$lte = new Date(to);
    }

    // Special filters
    if (overdue === 'true') {
      const now = new Date();
      filter.scheduledDate = { $lt: now };
      filter.status = { $in: ['scheduled', 'pending'] };
    }

    if (today === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.scheduledDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reminders = await Reminder.find(filter)
      .populate('createdBy', 'fullName')
      .populate('completedBy', 'fullName')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Reminder.countDocuments(filter);

    return res.json({
      reminders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List reminders error:', error);
    return res.status(500).json({ message: 'Failed to list reminders' });
  }
};

// Get single reminder
exports.getReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id)
      .populate('createdBy', 'fullName')
      .populate('completedBy', 'fullName');
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    return res.json(reminder);
  } catch (error) {
    console.error('Get reminder error:', error);
    return res.status(500).json({ message: 'Failed to get reminder' });
  }
};

// Update reminder
exports.updateReminder = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Convert dates if provided
    if (updates.scheduledDate) updates.scheduledDate = new Date(updates.scheduledDate);
    if (updates.recurrenceEnd) updates.recurrenceEnd = new Date(updates.recurrenceEnd);
    if (updates.followup?.nextDueDate) {
      updates.followup.nextDueDate = new Date(updates.followup.nextDueDate);
    }
    if (updates.followup?.lastCheckDate) {
      updates.followup.lastCheckDate = new Date(updates.followup.lastCheckDate);
    }

    // Add update tracking
    updates.updatedBy = req.user?.id || null;
    updates.updatedByName = req.user?.fullName || 'Health Officer';

    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    return res.json(reminder);
  } catch (error) {
    console.error('Update reminder error:', error);
    return res.status(500).json({ message: 'Failed to update reminder' });
  }
};

// Delete reminder
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    return res.json({ 
      success: true, 
      message: 'Reminder deleted successfully' 
    });
  } catch (error) {
    console.error('Delete reminder error:', error);
    return res.status(500).json({ message: 'Failed to delete reminder' });
  }
};

// ==================== CREW-FACING REMINDER CRUD ====================

const toDateOrUndefined = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const translateStatusFilter = (status) => {
  if (!status || status === 'all') return undefined;
  if (status === 'active') return { $in: ['scheduled', 'pending'] };
  return status;
};

const normalizeCrewReminderPayload = (body = {}) => {
  const payload = {};
  if (body.type) payload.type = body.type;
  if (body.title) payload.title = body.title;
  if (body.description !== undefined) payload.description = body.description;
  if (body.notes !== undefined) payload.notes = body.notes;
  if (body.tags !== undefined) payload.tags = Array.isArray(body.tags) ? body.tags : [body.tags];
  if (body.status) payload.status = body.status;
  if (body.scheduledDate) {
    const date = toDateOrUndefined(body.scheduledDate);
    if (date) payload.scheduledDate = date;
  }
  if (body.scheduledTime !== undefined) payload.scheduledTime = body.scheduledTime || null;
  if (body.recurrencePattern !== undefined) {
    payload.isRecurring = body.recurrencePattern && body.recurrencePattern !== 'none';
    payload.recurrencePattern = payload.isRecurring ? body.recurrencePattern : undefined;
  }
  if (body.recurrenceEnd) {
    const end = toDateOrUndefined(body.recurrenceEnd);
    if (end) payload.recurrenceEnd = end;
  }
  return payload;
};

const mapReminderForCrew = (reminder) => {
  if (!reminder) return reminder;
  if (typeof reminder.toObject === 'function') return reminder.toObject();
  return reminder;
};

exports.listMyReminders = async (req, res) => {
  try {
    const crewId = req.user?.crewId;
    if (!crewId) {
      return res.status(403).json({ message: 'Crew profile not associated with this account' });
    }

    const { type, status, from, to } = req.query;
    const filter = { crewId };

    if (type && type !== 'all') filter.type = type;
    const statusFilter = translateStatusFilter(status);
    if (statusFilter) filter.status = statusFilter;

    if (from || to) {
      const range = {};
      const fromDate = toDateOrUndefined(from);
      const toDate = toDateOrUndefined(to);
      if (fromDate) range.$gte = fromDate;
      if (toDate) range.$lte = toDate;
      if (Object.keys(range).length > 0) {
        filter.scheduledDate = range;
      }
    }

    const reminders = await Reminder.find(filter)
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .lean();

    return res.json({ reminders: reminders.map(mapReminderForCrew) });
  } catch (error) {
    console.error('List crew reminders error:', error);
    return res.status(500).json({ message: 'Failed to load reminders' });
  }
};

exports.createMyReminder = async (req, res) => {
  try {
    const crewId = req.user?.crewId;
    if (!crewId) {
      return res.status(403).json({ message: 'Crew profile not associated with this account' });
    }

    const crewName = req.user?.fullName || req.user?.name || 'Crew Member';
    const {
      type = 'other',
      title,
      description,
      scheduledDate,
      scheduledTime,
      notes,
      recurrencePattern,
      recurrenceEnd,
      tags,
    } = req.body || {};

    if (!title || !scheduledDate) {
      return res.status(400).json({ message: 'Title and scheduled date are required' });
    }

    const payload = normalizeCrewReminderPayload({
      type,
      title,
      description,
      scheduledDate,
      scheduledTime,
      notes,
      recurrencePattern,
      recurrenceEnd,
      tags,
    });

    payload.crewId = crewId;
    payload.crewName = crewName;
    payload.createdBy = req.user?.sub || null;
    payload.createdByName = crewName;

    const reminder = await Reminder.create(payload);
    return res.status(201).json(mapReminderForCrew(reminder));
  } catch (error) {
    console.error('Create crew reminder error:', error);
    return res.status(500).json({ message: 'Failed to create reminder' });
  }
};

exports.updateMyReminder = async (req, res) => {
  try {
    const crewId = req.user?.crewId;
    if (!crewId) {
      return res.status(403).json({ message: 'Crew profile not associated with this account' });
    }

    const updates = normalizeCrewReminderPayload(req.body);
    updates.updatedBy = req.user?.sub || null;
    updates.updatedByName = req.user?.fullName || req.user?.name || 'Crew Member';

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, crewId },
      updates,
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    return res.json(mapReminderForCrew(reminder));
  } catch (error) {
    console.error('Update crew reminder error:', error);
    return res.status(500).json({ message: 'Failed to update reminder' });
  }
};

exports.deleteMyReminder = async (req, res) => {
  try {
    const crewId = req.user?.crewId;
    if (!crewId) {
      return res.status(403).json({ message: 'Crew profile not associated with this account' });
    }

    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, crewId });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete crew reminder error:', error);
    return res.status(500).json({ message: 'Failed to delete reminder' });
  }
};

exports.markMyReminderCompleted = async (req, res) => {
  try {
    const crewId = req.user?.crewId;
    if (!crewId) {
      return res.status(403).json({ message: 'Crew profile not associated with this account' });
    }

    const reminder = await Reminder.findOne({ _id: req.params.id, crewId });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    await reminder.markCompleted(req.user?.sub || null, req.user?.fullName || 'Crew Member', req.body?.notes || '');
    return res.json(mapReminderForCrew(reminder));
  } catch (error) {
    console.error('Mark crew reminder completed error:', error);
    return res.status(500).json({ message: 'Failed to mark reminder as completed' });
  }
};

exports.snoozeMyReminder = async (req, res) => {
  try {
    const crewId = req.user?.crewId;
    if (!crewId) {
      return res.status(403).json({ message: 'Crew profile not associated with this account' });
    }

    const minutes = parseInt(req.body?.minutes ?? 60, 10);
    const reminder = await Reminder.findOne({ _id: req.params.id, crewId });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    await reminder.snooze(Number.isNaN(minutes) ? 60 : minutes);
    return res.json(mapReminderForCrew(reminder));
  } catch (error) {
    console.error('Snooze crew reminder error:', error);
    return res.status(500).json({ message: 'Failed to snooze reminder' });
  }
};

exports.rescheduleMyReminder = async (req, res) => {
  try {
    const crewId = req.user?.crewId;
    if (!crewId) {
      return res.status(403).json({ message: 'Crew profile not associated with this account' });
    }

    const { scheduledDate, scheduledTime } = req.body || {};
    if (!scheduledDate) {
      return res.status(400).json({ message: 'New scheduled date is required' });
    }

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, crewId },
      {
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: 'scheduled',
        snoozedUntil: null,
        updatedBy: req.user?.sub || null,
        updatedByName: req.user?.fullName || req.user?.name || 'Crew Member',
      },
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    return res.json(mapReminderForCrew(reminder));
  } catch (error) {
    console.error('Reschedule crew reminder error:', error);
    return res.status(500).json({ message: 'Failed to reschedule reminder' });
  }
};

// ==================== REMINDER ACTIONS ====================

// Mark reminder as completed
exports.markCompleted = async (req, res) => {
  try {
    const { notes } = req.body;
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    await reminder.markCompleted(
      req.user?.id,
      req.user?.fullName || 'Health Officer',
      notes
    );

    return res.json(reminder);
  } catch (error) {
    console.error('Mark completed error:', error);
    return res.status(500).json({ message: 'Failed to mark reminder as completed' });
  }
};

// Snooze reminder
exports.snoozeReminder = async (req, res) => {
  try {
    const { minutes = 60 } = req.body;
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    await reminder.snooze(parseInt(minutes));

    return res.json(reminder);
  } catch (error) {
    console.error('Snooze reminder error:', error);
    return res.status(500).json({ message: 'Failed to snooze reminder' });
  }
};

// Reschedule reminder
exports.rescheduleReminder = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime } = req.body;
    
    if (!scheduledDate) {
      return res.status(400).json({ message: 'New scheduled date is required' });
    }

    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      {
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: 'scheduled',
        snoozedUntil: null,
        updatedBy: req.user?.id || null,
        updatedByName: req.user?.fullName || 'Health Officer'
      },
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    return res.json(reminder);
  } catch (error) {
    console.error('Reschedule reminder error:', error);
    return res.status(500).json({ message: 'Failed to reschedule reminder' });
  }
};

// ==================== DASHBOARD & STATISTICS ====================

// Get dashboard summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get counts for different categories
    const [
      totalActive,
      todaysReminders,
      overdueReminders,
      completedToday,
      medicationReminders,
      followupReminders
    ] = await Promise.all([
      Reminder.countDocuments({ status: { $in: ['scheduled', 'pending'] } }),
      Reminder.countDocuments({
        scheduledDate: { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ['scheduled', 'pending'] }
      }),
      Reminder.countDocuments({
        scheduledDate: { $lt: today },
        status: { $in: ['scheduled', 'pending'] }
      }),
      Reminder.countDocuments({
        completedAt: { $gte: startOfDay, $lt: endOfDay }
      }),
      Reminder.countDocuments({ 
        type: 'medication',
        status: { $in: ['scheduled', 'pending'] }
      }),
      Reminder.countDocuments({ 
        type: 'followup',
        status: { $in: ['scheduled', 'pending'] }
      })
    ]);

    // Get recent activity
    const recentActivity = await Reminder.find({
      $or: [
        { completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    })
    .populate('createdBy', 'fullName')
    .populate('completedBy', 'fullName')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

    return res.json({
      summary: {
        totalActive,
        todaysReminders,
        overdueReminders,
        completedToday,
        medicationReminders,
        followupReminders
      },
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ message: 'Failed to get dashboard summary' });
  }
};

// Get reminder statistics
exports.getReminderStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Completion rate by type
    const completionStats = await Reminder.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          missed: {
            $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          type: '$_id',
          total: 1,
          completed: 1,
          missed: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completed', '$total'] },
              100
            ]
          }
        }
      }
    ]);

    // Daily completion trends
    const dailyTrends = await Reminder.aggregate([
      {
        $match: {
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    return res.json({
      completionStats,
      dailyTrends
    });
  } catch (error) {
    console.error('Reminder stats error:', error);
    return res.status(500).json({ message: 'Failed to get reminder statistics' });
  }
};

// Bulk operations
exports.bulkUpdateReminders = async (req, res) => {
  try {
    const { reminderIds, updates } = req.body;

    if (!reminderIds || !Array.isArray(reminderIds) || reminderIds.length === 0) {
      return res.status(400).json({ message: 'Reminder IDs are required' });
    }

    // Add update tracking
    const updateData = {
      ...updates,
      updatedBy: req.user?.id || null,
      updatedByName: req.user?.fullName || 'Health Officer'
    };

    const result = await Reminder.updateMany(
      { _id: { $in: reminderIds } },
      updateData
    );

    return res.json({
      success: true,
      message: `Updated ${result.modifiedCount} reminders`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ message: 'Failed to update reminders' });
  }
};
