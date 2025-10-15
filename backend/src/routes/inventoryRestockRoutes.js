const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/inventoryRestockController');

const router = express.Router();

// Public health check for this resource (optional)
router.get('/health', (req, res) => res.json({ status: 'ok', resource: 'inventory-restock' }));

// All restock routes require authentication
router.use(authenticate);

// List with filters and pagination
router.get('/', ctrl.list);

// Read one
router.get('/:id', ctrl.get);

// Mutations - allow any authenticated user to create restock orders for now
router.post('/', ctrl.create);
router.patch('/:id', requireRole('inventory'), ctrl.update);
router.delete('/:id', requireRole('inventory'), ctrl.remove);

module.exports = router;
