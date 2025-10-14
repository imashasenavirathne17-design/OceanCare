const InventoryRestockOrder = require('../models/InventoryRestockOrder');
const InventoryItem = require('../models/InventoryItem');
const { logAuditEvent } = require('../utils/auditLogger');

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildFilters = (query = {}) => {
  const filter = {};
  if (query.type && query.type !== 'all') filter.type = query.type;
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.priority && query.priority !== 'all') filter.priority = query.priority;
  if (query.term) {
    const regex = new RegExp(query.term, 'i');
    filter.$or = [
      { itemName: regex },
      { notes: regex },
    ];
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const toDate = new Date(query.to);
      toDate.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }
  return filter;
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = buildFilters(req.query);
    const skip = (toInt(page, 1) - 1) * toInt(limit, 10);

    const [orders, total] = await Promise.all([
      InventoryRestockOrder.find(filter)
        .populate('itemId', 'name unit')
        .sort(sort)
        .skip(skip)
        .limit(toInt(limit, 10))
        .lean(),
      InventoryRestockOrder.countDocuments(filter),
    ]);

    return res.json({
      orders,
      pagination: {
        page: toInt(page, 1),
        limit: toInt(limit, 10),
        total,
        pages: Math.ceil(total / toInt(limit, 10)) || 1,
      },
    });
  } catch (err) {
    console.error('List inventory restock orders error:', err);
    return res.status(500).json({ message: 'Failed to fetch restock orders' });
  }
};

exports.get = async (req, res) => {
  try {
    const order = await InventoryRestockOrder.findById(req.params.id)
      .populate('itemId', 'name unit')
      .lean();
    if (!order) return res.status(404).json({ message: 'Restock order not found' });
    return res.json(order);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to fetch order', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user?.id,
    };

    // If this is a completed restock order, update inventory quantity and expiry
    if (payload.status === 'completed' && payload.itemId && payload.quantity) {
      const inventoryItem = await InventoryItem.findById(payload.itemId);
      if (!inventoryItem) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }

      // Update inventory quantity
      inventoryItem.qty += payload.quantity;

      // Update expiry date if provided in restock order
      if (payload.expiry) {
        inventoryItem.expiry = payload.expiry;
      }

      await inventoryItem.save();

      await logAuditEvent({
        resource: 'inventory-item',
        action: 'update',
        status: 'success',
        userId: req.user?.id,
        userName: req.user?.fullName,
        details: `Updated inventory: ${inventoryItem.name} - Quantity: +${payload.quantity}${payload.expiry ? `, Expiry: ${new Date(payload.expiry).toLocaleDateString()}` : ''}`,
        metadata: { itemId: inventoryItem._id, newQuantity: inventoryItem.qty, newExpiry: inventoryItem.expiry, addedQuantity: payload.quantity },
      });
    }

    const order = await InventoryRestockOrder.create(payload);

    await logAuditEvent({
      resource: 'inventory-restock',
      action: 'create',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Created restock order for ${order.itemName} (${order.quantity} ${order.unit})`,
      metadata: { orderId: order._id, payload },
    });

    return res.status(201).json(order.toObject());
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory-restock',
      action: 'create',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to create restock order: ${err.message}`,
      metadata: { payload: req.body },
    });
    return res.status(400).json({ message: 'Failed to create order', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await InventoryRestockOrder.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Restock order not found' });

    const updates = { ...req.body };
    if (updates.status === 'completed' && !existing.processedBy) {
      updates.processedBy = req.user?.id;
    }

    const order = await InventoryRestockOrder.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('itemId', 'name unit');

    await logAuditEvent({
      resource: 'inventory-restock',
      action: 'update',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Updated restock order ${order.itemName}`,
      metadata: { orderId: order._id, before: existing.toObject(), updates },
    });

    return res.json(order.toObject());
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory-restock',
      action: 'update',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to update restock order: ${err.message}`,
      metadata: { payload: req.body },
    });
    return res.status(400).json({ message: 'Failed to update order', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const existing = await InventoryRestockOrder.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Restock order not found' });

    await InventoryRestockOrder.findByIdAndDelete(req.params.id);

    await logAuditEvent({
      resource: 'inventory-restock',
      action: 'delete',
      status: 'success',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Deleted restock order ${existing.itemName}`,
      metadata: { orderId: existing._id },
    });

    return res.json({ message: 'Restock order deleted' });
  } catch (err) {
    await logAuditEvent({
      resource: 'inventory-restock',
      action: 'delete',
      status: 'failure',
      userId: req.user?.id,
      userName: req.user?.fullName,
      details: `Failed to delete restock order: ${err.message}`,
    });
    return res.status(400).json({ message: 'Failed to delete order', error: err.message });
  }
};
