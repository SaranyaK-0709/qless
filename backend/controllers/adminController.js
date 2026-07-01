const pool = require('../config/db');

/**
 * Helper: resolve org_id from JWT or fallback to DB lookup
 */
const resolveOrgId = async (req) => {
  // super_admin can pass orgId as query param
  if (req.user.role === 'super_admin') {
    return req.query.orgId || req.user.organization_id || null;
  }
  // Use org from JWT if available
  if (req.user.organization_id) return req.user.organization_id;
  // Fallback: look up from DB (handles old tokens without org_id)
  const [rows] = await pool.query('SELECT organization_id FROM users WHERE id = ?', [req.user.id]);
  return rows.length > 0 ? rows[0].organization_id : null;
};

/**
 * GET /api/admin/stats
 * Retrieve KPI summary and health score for admin dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);

    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required.' });
    }

    // 1. Today's total visitors
    const [visitorsResult] = await pool.query(
      'SELECT COUNT(*) as count FROM tokens WHERE organization_id = ? AND DATE(created_at) = CURDATE()',
      [orgId]
    );
    const totalVisitors = visitorsResult[0].count;

    // 2. Today's completed tokens
    const [completedResult] = await pool.query(
      "SELECT COUNT(*) as count FROM tokens WHERE organization_id = ? AND status = 'COMPLETED' AND DATE(created_at) = CURDATE()",
      [orgId]
    );
    const completedCount = completedResult[0].count;

    // 3. Average wait time (in minutes) for called/completed tokens today
    const [waitResult] = await pool.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)) as avg_wait 
       FROM tokens 
       WHERE organization_id = ? AND called_at IS NOT NULL AND DATE(created_at) = CURDATE()`,
      [orgId]
    );
    const avgWaitTime = Math.round(waitResult[0].avg_wait || 0);

    // 4. Missed/skipped tokens count
    const [missedResult] = await pool.query(
      "SELECT COUNT(*) as count FROM tokens WHERE organization_id = ? AND status IN ('SKIPPED', 'MISSED') AND DATE(created_at) = CURDATE()",
      [orgId]
    );
    const missedCount = missedResult[0].count;

    // 5. Calculate Live Queue Health Score (0 - 100)
    // Formula: starts at 100, penalize for wait time exceeding 15 mins, and penalize for high skipped rate.
    let healthScore = 100;
    if (avgWaitTime > 15) {
      healthScore -= Math.min(40, (avgWaitTime - 15) * 2);
    }
    if (totalVisitors > 0) {
      const skipRate = (missedCount / totalVisitors) * 100;
      healthScore -= Math.min(30, skipRate * 1.5);
    }
    healthScore = Math.max(0, Math.round(healthScore));

    // 6. Queue stats by service
    const [serviceStats] = await pool.query(
      `SELECT s.id, s.name, s.prefix, s.avg_service_time,
              COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as waiting_count,
              COUNT(CASE WHEN t.status IN ('CALLED', 'IN_SERVICE') THEN 1 END) as active_count
       FROM services s
       LEFT JOIN tokens t ON s.id = t.service_id AND DATE(t.created_at) = CURDATE()
       WHERE s.organization_id = ? AND s.is_active = TRUE
       GROUP BY s.id`,
      [orgId]
    );

    // 7. Counter status
    const [counterStats] = await pool.query(
      `SELECT c.id, c.name, u.name as staff_name, s.name as service_name, 
              t.token_number as current_token, t.status as token_status
       FROM counters c
       LEFT JOIN users u ON c.staff_id = u.id
       LEFT JOIN services s ON c.service_id = s.id
       LEFT JOIN tokens t ON c.current_token_id = t.id
       WHERE c.organization_id = ?`,
      [orgId]
    );

    // 8. Recent activity feed (last 10 audit logs)
    const [logs] = await pool.query(
      `SELECT a.*, u.name as user_name 
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.organization_id = ?
       ORDER BY a.created_at DESC LIMIT 10`,
      [orgId]
    );

    res.json({
      success: true,
      stats: {
        totalVisitors,
        completedCount,
        avgWaitTime,
        healthScore,
        serviceStats,
        counterStats,
        recentLogs: logs
      }
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving dashboard stats.' });
  }
};

/**
 * GET /api/admin/analytics
 * Retrieve data for Recharts analytical visualizations
 */
const getAnalyticsCharts = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);

    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required.' });
    }

    // 1. Peak Hours chart (Hourly visitor distribution for today)
    const [peakHoursResult] = await pool.query(
      `SELECT HOUR(created_at) as hour, COUNT(*) as count 
       FROM tokens 
       WHERE organization_id = ? AND DATE(created_at) = CURDATE()
       GROUP BY HOUR(created_at) 
       ORDER BY hour`,
      [orgId]
    );

    // Create 24 hours template populated with real data
    const peakHoursData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      count: 0
    }));
    peakHoursResult.forEach(row => {
      if (row.hour >= 0 && row.hour < 24) {
        peakHoursData[row.hour].count = row.count;
      }
    });

    // Filter to standard business hours 08:00 - 20:00 for clean visualization
    const businessHoursData = peakHoursData.slice(8, 21);

    // 2. Service Distribution (Tokens breakdown by service today)
    const [serviceDistribution] = await pool.query(
      `SELECT s.name as name, COUNT(t.id) as value 
       FROM services s
       JOIN tokens t ON s.id = t.service_id
       WHERE s.organization_id = ? AND DATE(t.created_at) = CURDATE()
       GROUP BY s.id`,
      [orgId]
    );

    // 3. Daily Visitor Trends (Visitor count per day over the last 7 days)
    const [dailyTrends] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count 
       FROM tokens 
       WHERE organization_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY date`,
      [orgId]
    );

    res.json({
      success: true,
      charts: {
        peakHours: businessHoursData,
        serviceDistribution,
        dailyTrends
      }
    });
  } catch (err) {
    console.error('getAnalyticsCharts error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving analytics charts.' });
  }
};

/**
 * GET /api/admin/audit-logs
 * Fetch audit logs timeline for the organization
 */
const getAuditLogs = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);

    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required.' });
    }

    const [logs] = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.organization_id = ?
       ORDER BY a.created_at DESC`,
      [orgId]
    );

    res.json({ success: true, logs });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving audit logs.' });
  }
};

module.exports = {
  getDashboardStats,
  getAnalyticsCharts,
  getAuditLogs
};
