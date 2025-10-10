const Role = require('../models/Role');

// Build filter from query
function buildFilter(query) {
  const { q } = query;
  const filter = {};
  if (q) filter.$text = { $search: q };
  return filter;
}

// Five main roles reserved by the system
const MAIN_ROLES = [
  { key: 'crew', name: 'Crew', description: 'General crew member access' },
  { key: 'health', name: 'Health Officer', description: 'Medical roles and health data access' },
  { key: 'emergency', name: 'Emergency Officer', description: 'Emergency operations and alerts' },
  { key: 'inventory', name: 'Inventory Manager', description: 'Inventory management and stock control' },
  { key: 'admin', name: 'Admin', description: 'Full administrative privileges' },
];
const MAIN_KEYS = new Set(MAIN_ROLES.map(r => r.key));
const MAIN_NAMES_LC = new Set(MAIN_ROLES.map(r => r.name.toLowerCase()));

// GET /api/admin/roles-custom
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const filter = buildFilter(req.query);

    const [items, total] = await Promise.all([
      Role.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Role.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[roles:list] error', err);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

// POST /api/admin/roles-custom/seed-system
// Idempotently upserts the 5 main roles as system-protected
exports.seedSystem = async (_req, res) => {
  try {
    let upserted = 0;
    for (const r of MAIN_ROLES) {
      const update = {
        $set: {
          key: r.key,
          name: r.name,
          description: r.description,
          system: true,
        },
        $setOnInsert: { permissions: [] },
      };
      const result = await Role.updateOne({ key: r.key }, update, { upsert: true });
      if (result.upsertedCount || result.modifiedCount) upserted++;
    }
    const all = await Role.find({ key: { $in: Array.from(MAIN_KEYS) } }).lean();
    res.json({ upserted, totalSystem: all.length, roles: all });
  } catch (err) {
    console.error('[roles:seedSystem] error', err);
    res.status(500).json({ message: 'Failed to seed system roles' });
  }
};

// GET /api/admin/roles-custom/:id
exports.get = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (err) {
    console.error('[roles:get] error', err);
    res.status(500).json({ message: 'Failed to fetch role' });
  }
};

// POST /api/admin/roles-custom
exports.create = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    // Prevent creating custom roles that collide with main roles
    if (MAIN_NAMES_LC.has(String(name).trim().toLowerCase())) {
      return res.status(400).json({ message: 'This name is reserved for a main system role' });
    }

    const exists = await Role.findOne({ name: new RegExp(`^${String(name).trim()}$`, 'i') });
    if (exists) return res.status(409).json({ message: 'A role with this name already exists' });

    const role = await Role.create({ name: String(name).trim(), description, permissions: Array.isArray(permissions) ? permissions : [] });
    res.status(201).json(role);
  } catch (err) {
    console.error('[roles:create] error', err);
    res.status(500).json({ message: 'Failed to create role' });
  }
};

// PATCH /api/admin/roles-custom/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.system) return res.status(400).json({ message: 'System role cannot be modified' });

    if (name) {
      if (MAIN_NAMES_LC.has(String(name).trim().toLowerCase())) {
        return res.status(400).json({ message: 'This name is reserved for a main system role' });
      }
      const dupe = await Role.findOne({ _id: { $ne: id }, name: new RegExp(`^${String(name).trim()}$`, 'i') });
      if (dupe) return res.status(409).json({ message: 'Another role with this name already exists' });
      role.name = String(name).trim();
    }
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = Array.isArray(permissions) ? permissions : [];

    await role.save();
    res.json(role);
  } catch (err) {
    console.error('[roles:update] error', err);
    res.status(500).json({ message: 'Failed to update role' });
  }
};

// DELETE /api/admin/roles-custom/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.system) return res.status(400).json({ message: 'System role cannot be deleted' });

    await role.deleteOne();
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error('[roles:delete] error', err);
    res.status(500).json({ message: 'Failed to delete role' });
  }
};
