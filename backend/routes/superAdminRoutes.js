const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { getPlatformStats } = require('../controllers/superAdminController');

router.get('/stats', auth, authorize('super_admin'), getPlatformStats);

module.exports = router;
