const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { getDashboardStats, getAnalyticsCharts, getAuditLogs } = require('../controllers/adminController');

router.get('/stats', auth, authorize('admin', 'super_admin'), getDashboardStats);
router.get('/analytics', auth, authorize('admin', 'super_admin'), getAnalyticsCharts);
router.get('/audit-logs', auth, authorize('admin', 'super_admin'), getAuditLogs);

module.exports = router;
