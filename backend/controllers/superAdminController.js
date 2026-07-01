const pool = require('../config/db');

/**
 * GET /api/super-admin/stats
 * Get platform-wide overview metrics
 */
const getPlatformStats = async (req, res) => {
  try {
    const [[{ count: orgCount }]] = await pool.query('SELECT COUNT(*) as count FROM organizations');
    const [[{ count: branchCount }]] = await pool.query('SELECT COUNT(*) as count FROM branches');
    const [[{ count: userCount }]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[{ count: tokenCount }]] = await pool.query('SELECT COUNT(*) as count FROM tokens WHERE DATE(created_at) = CURDATE()');
    
    const [organizations] = await pool.query(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM branches b WHERE b.organization_id = o.id) as branch_count,
              (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as user_count
       FROM organizations o 
       ORDER BY o.created_at DESC`
    );

    res.json({
      success: true,
      stats: {
        organizationsCount: orgCount,
        branchesCount: branchCount,
        usersCount: userCount,
        todayTokensCount: tokenCount,
        organizations
      }
    });
  } catch (err) {
    console.error('getPlatformStats error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving super admin stats.' });
  }
};

module.exports = {
  getPlatformStats
};
