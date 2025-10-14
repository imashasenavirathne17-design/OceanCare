const { EmergencyMessage } = require('../models/EmergencyMessage');
const { User } = require('../models/User');

function sanitizeUser(u) {
  if (!u) return null;
  const extra = (() => {
    try {
      if (!u.extra) return {};
      if (typeof u.extra === 'object') return u.extra;
      const parsed = JSON.parse(u.extra);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      return {};
    }
  })();

  return {
    id: String(u._id),
    crewId: u.crewId || '',
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    department: extra.department || extra.dept || '',
    position: extra.position || extra.role || '',
    vessel: u.vessel || '',
    status: u.status,
  };
}

exports.listContacts = async (req, res) => {
  try {
    const crew = await User.find({ role: 'crew' }).lean();
    const emergency = await User.find({ role: 'emergency' }).lean();
    const medical = await User.find({ role: 'health' }).lean();

    const contacts = [...crew, ...emergency, ...medical]
      .map(sanitizeUser)
      .filter(Boolean)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    res.json(contacts);
  } catch (err) {
    console.error('listContacts error:', err);
    res.status(500).json({ message: 'Failed to load contacts' });
  }
};

exports.listDashboardMessages = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recent = await EmergencyMessage.find()
      .sort({ sentAt: -1 })
      .limit(Math.min(Number(limit) || 10, 50))
      .lean();
    res.json(recent);
  } catch (err) {
    console.error('listDashboardMessages error:', err);
    res.status(500).json({ message: 'Failed to load message history' });
  }
};

exports.listThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    if (!threadId) return res.status(400).json({ message: 'threadId required' });
    const msgs = await EmergencyMessage.find({ threadId }).sort({ sentAt: 1 }).lean();
    res.json(msgs);
  } catch (err) {
    console.error('listThreadMessages error:', err);
    res.status(500).json({ message: 'Failed to load messages' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { threadId, toId, toName, content, priority = 'normal', recipientType = 'individual' } = req.body;
    if (!threadId || !toId || !toName || !content) {
      return res.status(400).json({ message: 'threadId, toId, toName, and content are required' });
    }

    const sender = await User.findById(req.user?.sub).lean();
    if (!sender) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const message = await EmergencyMessage.create({
      threadId,
      fromId: String(sender._id),
      fromName: sender.fullName,
      toId,
      toName,
      recipientType,
      priority,
      content,
      status: 'sent',
      sentAt: new Date(),
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['sent', 'delivered', 'read'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const update = { status };
    if (status === 'read') update.readAt = new Date();
    const message = await EmergencyMessage.findByIdAndUpdate(id, update, { new: true });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    console.error('updateMessageStatus error:', err);
    res.status(500).json({ message: 'Failed to update message status' });
  }
};

exports.updateMessageContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const userId = String(req.user?.sub || '');
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const message = await EmergencyMessage.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (String(message.fromId) !== userId) {
      return res.status(403).json({ message: 'You can only edit messages you sent' });
    }

    if (message.status !== 'sent') {
      return res.status(409).json({ message: 'Only messages with status "sent" can be edited' });
    }

    message.content = content.trim();
    await message.save();

    res.json(message);
  } catch (err) {
    console.error('updateMessageContent error:', err);
    res.status(500).json({ message: 'Failed to update message' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user?.sub || '');
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const message = await EmergencyMessage.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const requester = await User.findById(userId).lean();
    const requesterRole = requester?.role || '';
    const privileged = ['admin', 'emergency', 'health'].includes(String(requesterRole).toLowerCase());
    const isParticipant = String(message.fromId) === userId || String(message.toId) === userId;

    if (!privileged && !isParticipant) {
      return res.status(403).json({ message: 'You do not have permission to delete this message' });
    }

    await message.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};
