const pool = require('../config/db');

/**
 * POST /api/tokens/book
 * Book a new queue token for a customer
 */
const bookToken = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { organization_id, branch_id, service_id } = req.body;
    const user_id = req.user.id;

    if (!organization_id || !branch_id || !service_id) {
      return res.status(400).json({ success: false, message: 'Organization, branch, and service are required.' });
    }

    await connection.beginTransaction();

    // 1. Get service prefix & average service time
    const [services] = await connection.query(
      'SELECT prefix, avg_service_time FROM services WHERE id = ? AND branch_id = ? AND is_active = TRUE',
      [service_id, branch_id]
    );

    if (services.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Selected service is invalid or inactive.' });
    }

    const { prefix, avg_service_time } = services[0];

    // 2. Determine token number for today (e.g. CAR-101, CAR-102...)
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM tokens WHERE service_id = ? AND DATE(created_at) = CURDATE()',
      [service_id]
    );
    const todayCount = countResult[0].count;
    const tokenNumber = `${prefix}-${101 + todayCount}`;

    // 3. Create the token
    const [result] = await connection.query(
      `INSERT INTO tokens (token_number, organization_id, branch_id, service_id, user_id, status) 
       VALUES (?, ?, ?, ?, ?, 'WAITING')`,
      [tokenNumber, organization_id, branch_id, service_id, user_id]
    );

    const tokenId = result.insertId;

    // 4. Calculate people ahead
    const [aheadResult] = await connection.query(
      `SELECT COUNT(*) as count FROM tokens 
       WHERE service_id = ? AND status = 'WAITING' AND id < ? AND DATE(created_at) = CURDATE()`,
      [service_id, tokenId]
    );
    const peopleAhead = aheadResult[0].count;
    const estimatedWait = peopleAhead * avg_service_time;

    // 5. Audit Log
    await connection.query(
      `INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, details, ip_address) 
       VALUES (?, ?, 'TOKEN_BOOKED', 'token', ?, ?, ?)`,
      [user_id, organization_id, tokenId, JSON.stringify({ tokenNumber, serviceId: service_id }), req.ip]
    );

    await connection.commit();

    // 6. Broadcast real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${service_id}`).emit('queue:update', { serviceId: service_id });
      io.to(`branch:${branch_id}`).emit('branch:update', { branchId: branch_id });
    }

    res.status(201).json({
      success: true,
      message: 'Token booked successfully.',
      token: {
        id: tokenId,
        token_number: tokenNumber,
        status: 'WAITING',
        people_ahead: peopleAhead,
        estimated_wait: estimatedWait,
        service_id,
        branch_id
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('bookToken error:', err);
    res.status(500).json({ success: false, message: 'Server error booking token.' });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/tokens/:tokenId
 * Get token status and live queue metadata
 */
const getTokenDetails = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const [tokens] = await pool.query(
      `SELECT t.*, s.name as service_name, s.avg_service_time, b.name as branch_name, o.name as organization_name,
              c.name as counter_name
       FROM tokens t
       JOIN services s ON t.service_id = s.id
       JOIN branches b ON t.branch_id = b.id
       JOIN organizations o ON t.organization_id = o.id
       LEFT JOIN counters c ON t.counter_id = c.id
       WHERE t.id = ?`,
      [tokenId]
    );

    if (tokens.length === 0) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const token = tokens[0];
    let peopleAhead = 0;
    let estimatedWait = 0;
    let currentServingToken = null;

    if (token.status === 'WAITING') {
      // Calculate people ahead in queue
      const [aheadResult] = await pool.query(
        `SELECT COUNT(*) as count FROM tokens 
         WHERE service_id = ? AND status = 'WAITING' AND id < ? AND DATE(created_at) = CURDATE()`,
        [token.service_id, token.id]
      );
      peopleAhead = aheadResult[0].count;
      estimatedWait = peopleAhead * token.avg_service_time;

      // Find current serving token
      const [servingResult] = await pool.query(
        `SELECT token_number FROM tokens 
         WHERE service_id = ? AND status IN ('CALLED', 'IN_SERVICE') AND DATE(created_at) = CURDATE()
         ORDER BY id DESC LIMIT 1`,
        [token.service_id]
      );
      if (servingResult.length > 0) {
        currentServingToken = servingResult[0].token_number;
      }
    }

    res.json({
      success: true,
      token: {
        ...token,
        people_ahead: peopleAhead,
        estimated_wait: estimatedWait,
        current_serving: currentServingToken
      }
    });
  } catch (err) {
    console.error('getTokenDetails error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving token details.' });
  }
};

/**
 * GET /api/tokens/live/service/:serviceId
 * Get live queue list for a service
 */
const getLiveQueue = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Fetch active tokens
    const [tokens] = await pool.query(
      `SELECT id, token_number, status, called_at, started_at, user_id, counter_id
       FROM tokens 
       WHERE service_id = ? AND status IN ('WAITING', 'CALLED', 'IN_SERVICE') AND DATE(created_at) = CURDATE()
       ORDER BY id ASC`,
      [serviceId]
    );

    // Fetch current serving details
    const [currentServing] = await pool.query(
      `SELECT t.token_number, c.name as counter_name 
       FROM tokens t
       JOIN counters c ON t.counter_id = c.id
       WHERE t.service_id = ? AND t.status IN ('CALLED', 'IN_SERVICE') AND DATE(t.created_at) = CURDATE()
       ORDER BY t.id DESC LIMIT 1`,
      [serviceId]
    );

    res.json({
      success: true,
      queue: tokens,
      currentlyServing: currentServing.length > 0 ? currentServing[0] : null
    });
  } catch (err) {
    console.error('getLiveQueue error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving live queue.' });
  }
};

/**
 * POST /api/tokens/call
 * (Staff operation) Call next waiting token
 */
const callNext = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const staffId = req.user.id;

    // 1. Get staff's counter details
    const [counters] = await connection.query(
      'SELECT id, organization_id, branch_id, name, service_id FROM counters WHERE staff_id = ? AND is_active = TRUE LIMIT 1',
      [staffId]
    );

    if (counters.length === 0) {
      return res.status(400).json({ success: false, message: 'You are not assigned to an active counter.' });
    }

    const counter = counters[0];
    const { id: counterId, organization_id, service_id, name: counterName } = counter;

    if (!service_id) {
      return res.status(400).json({ success: false, message: 'This counter is not configured to serve any service.' });
    }

    await connection.beginTransaction();

    // 2. Fetch the next waiting token for the service
    const [nextTokens] = await connection.query(
      `SELECT * FROM tokens 
       WHERE service_id = ? AND status = 'WAITING' AND DATE(created_at) = CURDATE()
       ORDER BY id ASC LIMIT 1`,
      [service_id]
    );

    if (nextTokens.length === 0) {
      await connection.rollback();
      return res.json({ success: true, message: 'No tokens in queue for this service.', token: null });
    }

    const token = nextTokens[0];

    // 3. Update token status to CALLED and assign counter
    await connection.query(
      `UPDATE tokens SET status = 'CALLED', called_at = CURRENT_TIMESTAMP, counter_id = ? WHERE id = ?`,
      [counterId, token.id]
    );

    // 4. Set current token in counter
    await connection.query(
      `UPDATE counters SET current_token_id = ? WHERE id = ?`,
      [token.id, counterId]
    );

    // 5. Audit Log
    await connection.query(
      `INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, details, ip_address) 
       VALUES (?, ?, 'TOKEN_CALLED', 'token', ?, ?, ?)`,
      [staffId, organization_id, token.id, JSON.stringify({ tokenNumber: token.token_number, counterName }), req.ip]
    );

    // 6. Push notification entry
    if (token.user_id) {
      await connection.query(
        `INSERT INTO notifications (user_id, organization_id, title, message, type) 
         VALUES (?, ?, 'Token Called', ?, 'TOKEN_CALLED')`,
        [token.user_id, organization_id, `Your token ${token.token_number} has been called at ${counterName}. Please proceed.`]
      );
    }

    await connection.commit();

    // 7. Emit Socket.IO updates
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${service_id}`).emit('queue:update', { serviceId: service_id });
      io.to(`branch:${counter.branch_id}`).emit('branch:update', { branchId: counter.branch_id });
      io.to(`admin:${organization_id}`).emit('admin:update', { orgId: organization_id });
      if (token.user_id) {
        io.to(`user:${token.user_id}`).emit('notification', {
          title: 'Token Called',
          message: `Your token ${token.token_number} has been called at ${counterName}.`
        });
      }
    }

    res.json({
      success: true,
      message: `Token ${token.token_number} called successfully.`,
      token: {
        id: token.id,
        token_number: token.token_number,
        status: 'CALLED',
        counter_id: counterId,
        counter_name: counterName
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('callNext error:', err);
    res.status(500).json({ success: false, message: 'Server error calling next token.' });
  } finally {
    connection.release();
  }
};

/**
 * POST /api/tokens/:tokenId/start
 * (Staff operation) Start service for called token
 */
const startService = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const staffId = req.user.id;

    // Verify token status and ownership
    const [tokens] = await pool.query('SELECT * FROM tokens WHERE id = ?', [tokenId]);
    if (tokens.length === 0) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const token = tokens[0];
    if (token.status !== 'CALLED') {
      return res.status(400).json({ success: false, message: 'Token must be in CALLED state to start service.' });
    }

    // Update status to IN_SERVICE
    await pool.query(
      `UPDATE tokens SET status = 'IN_SERVICE', started_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [tokenId]
    );

    // Audit Log
    await pool.query(
      `INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, details, ip_address) 
       VALUES (?, ?, 'TOKEN_STARTED', 'token', ?, ?, ?)`,
      [staffId, token.organization_id, tokenId, JSON.stringify({ tokenNumber: token.token_number }), req.ip]
    );

    // Emit updates
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${token.service_id}`).emit('queue:update', { serviceId: token.service_id });
      io.to(`admin:${token.organization_id}`).emit('admin:update', { orgId: token.organization_id });
    }

    res.json({ success: true, message: 'Service started.', token: { ...token, status: 'IN_SERVICE' } });
  } catch (err) {
    console.error('startService error:', err);
    res.status(500).json({ success: false, message: 'Server error starting service.' });
  }
};

/**
 * POST /api/tokens/:tokenId/complete
 * (Staff operation) Complete service for token
 */
const completeService = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { tokenId } = req.params;
    const staffId = req.user.id;

    const [tokens] = await connection.query('SELECT * FROM tokens WHERE id = ?', [tokenId]);
    if (tokens.length === 0) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const token = tokens[0];
    if (token.status !== 'IN_SERVICE') {
      return res.status(400).json({ success: false, message: 'Token must be in IN_SERVICE state to complete.' });
    }

    await connection.beginTransaction();

    // 1. Calculate duration in seconds
    const duration = Math.max(0, Math.round((Date.now() - new Date(token.started_at).getTime()) / 1000));

    // 2. Update status and duration
    await connection.query(
      `UPDATE tokens SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, service_duration = ? WHERE id = ?`,
      [duration, tokenId]
    );

    // 3. Clear current token in counter
    await connection.query(
      `UPDATE counters SET current_token_id = NULL WHERE current_token_id = ?`,
      [tokenId]
    );

    // 4. Audit Log
    await connection.query(
      `INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, details, ip_address) 
       VALUES (?, ?, 'TOKEN_COMPLETED', 'token', ?, ?, ?)`,
      [staffId, token.organization_id, tokenId, JSON.stringify({ tokenNumber: token.token_number, duration }), req.ip]
    );

    await connection.commit();

    // Emit updates
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${token.service_id}`).emit('queue:update', { serviceId: token.service_id });
      io.to(`branch:${token.branch_id}`).emit('branch:update', { branchId: token.branch_id });
      io.to(`admin:${token.organization_id}`).emit('admin:update', { orgId: token.organization_id });
    }

    res.json({ success: true, message: 'Service completed successfully.', duration });
  } catch (err) {
    await connection.rollback();
    console.error('completeService error:', err);
    res.status(500).json({ success: false, message: 'Server error completing service.' });
  } finally {
    connection.release();
  }
};

/**
 * POST /api/tokens/:tokenId/skip
 * (Staff operation) Skip current token (customer missed/skipped)
 */
const skipService = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { tokenId } = req.params;
    const staffId = req.user.id;

    const [tokens] = await connection.query('SELECT * FROM tokens WHERE id = ?', [tokenId]);
    if (tokens.length === 0) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const token = tokens[0];
    if (token.status !== 'CALLED' && token.status !== 'IN_SERVICE') {
      return res.status(400).json({ success: false, message: 'Token status must be CALLED or IN_SERVICE to skip.' });
    }

    await connection.beginTransaction();

    // 1. Update status to SKIPPED
    await connection.query(
      `UPDATE tokens SET status = 'SKIPPED', completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [tokenId]
    );

    // 2. Clear current token in counter
    await connection.query(
      `UPDATE counters SET current_token_id = NULL WHERE current_token_id = ?`,
      [tokenId]
    );

    // 3. Audit Log
    await connection.query(
      `INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, details, ip_address) 
       VALUES (?, ?, 'TOKEN_SKIPPED', 'token', ?, ?, ?)`,
      [staffId, token.organization_id, tokenId, JSON.stringify({ tokenNumber: token.token_number }), req.ip]
    );

    await connection.commit();

    // Emit updates
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${token.service_id}`).emit('queue:update', { serviceId: token.service_id });
      io.to(`branch:${token.branch_id}`).emit('branch:update', { branchId: token.branch_id });
      io.to(`admin:${token.organization_id}`).emit('admin:update', { orgId: token.organization_id });
    }

    res.json({ success: true, message: 'Token skipped.' });
  } catch (err) {
    await connection.rollback();
    console.error('skipService error:', err);
    res.status(500).json({ success: false, message: 'Server error skipping token.' });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/tokens/user/active
 * Get active tokens for current user (waiting, called, or in service)
 */
const getUserActiveTokens = async (req, res) => {
  try {
    const userId = req.user.id;
    const [tokens] = await pool.query(
      `SELECT t.*, s.name as service_name, b.name as branch_name, o.name as organization_name
       FROM tokens t
       JOIN services s ON t.service_id = s.id
       JOIN branches b ON t.branch_id = b.id
       JOIN organizations o ON t.organization_id = o.id
       WHERE t.user_id = ? AND t.status IN ('WAITING', 'CALLED', 'IN_SERVICE') AND DATE(t.created_at) = CURDATE()
       ORDER BY t.id DESC`,
      [userId]
    );
    res.json({ success: true, tokens });
  } catch (err) {
    console.error('getUserActiveTokens error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving user active tokens.' });
  }
};

/**
 * GET /api/tokens/staff/counter-status
 * Get the current counter status and stats for a staff member
 */
const getStaffCounterStatus = async (req, res) => {
  try {
    const staffId = req.user.id;
    const [counters] = await pool.query(
      `SELECT c.id, c.name, c.service_id, s.name as service_name, 
              t.id as token_id, t.token_number, t.status as token_status
       FROM counters c
       LEFT JOIN services s ON c.service_id = s.id
       LEFT JOIN tokens t ON c.current_token_id = t.id
       WHERE c.staff_id = ? AND c.is_active = TRUE LIMIT 1`,
      [staffId]
    );

    if (counters.length === 0) {
      return res.json({ success: true, counter: null });
    }

    // Fetch staff stats for today: served tokens and avg time
    const [[{ served_count }]] = await pool.query(
      `SELECT COUNT(*) as served_count FROM tokens 
       WHERE counter_id = ? AND status = 'COMPLETED' AND DATE(completed_at) = CURDATE()`,
      [counters[0].id]
    );

    const [[{ avg_duration }]] = await pool.query(
      `SELECT AVG(service_duration) as avg_duration FROM tokens 
       WHERE counter_id = ? AND status = 'COMPLETED' AND DATE(completed_at) = CURDATE()`,
      [counters[0].id]
    );

    res.json({
      success: true,
      counter: counters[0],
      stats: {
        servedCount: served_count || 0,
        avgDuration: Math.round((avg_duration || 0) / 60) // convert to minutes
      }
    });
  } catch (err) {
    console.error('getStaffCounterStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving counter status.' });
  }
};

module.exports = {
  bookToken,
  getTokenDetails,
  getLiveQueue,
  callNext,
  startService,
  completeService,
  skipService,
  getUserActiveTokens,
  getStaffCounterStatus
};
