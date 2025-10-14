const express = require('express');
const router = express.Router();
const {
  list,
  get,
  create,
  update,
  remove,
} = require('../controllers/regulatoryReportController');

// Uncomment when auth middleware is available
// const { authenticateToken, authorizeRoles } = require('../middleware/auth');
// router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', list);
router.post('/', create);
router.get('/:id', get);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
