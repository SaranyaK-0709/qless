const pool = require('../config/db');

/**
 * GET /api/notifications
 * Retrieve notification feed for authenticated user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
