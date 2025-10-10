const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const admin = require('../controllers/adminController');
const roles = require('../controllers/roleController');

const router = express.Router();

// Secure all admin routes
router.use(authenticate, requireRole('admin'));

// Roles and admins
router.get('/roles', admin.listRoles);
router.get('/admins', admin.listAdmins);

// Custom Role CRUD
router.get('/roles-custom', roles.list);
router.get('/roles-custom/:id', roles.get);
router.post('/roles-custom', roles.create);
router.patch('/roles-custom/:id', roles.update);
router.delete('/roles-custom/:id', roles.remove);

// Change a user's role
router.patch('/users/:id/role', admin.changeUserRole);

module.exports = router;
