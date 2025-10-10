const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/inventoryController');

const router = express.Router();

// Public health check for this resource (optional)
router.get('/health', (req, res) => res.json({ status: 'ok', resource: 'inventory' }));

// All inventory routes require authentication
router.use(authenticate);

// List with filters and pagination
router.get('/', ctrl.getItems);

// Read one
router.get('/:id', ctrl.getItemById);

// Mutations restricted to inventory officers only
router.post('/', requireRole('inventory'), ctrl.createItem);
router.patch('/:id', requireRole('inventory'), ctrl.updateItem);
router.delete('/:id', requireRole('inventory'), ctrl.deleteItem);

module.exports = router;
