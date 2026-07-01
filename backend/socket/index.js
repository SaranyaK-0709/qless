/**
 * Socket.IO Server Initialization
 * 
 * Room Structure:
 *   branch:{branchId}    — all users watching a branch
 *   queue:{serviceId}    — users watching a specific service queue
 *   user:{userId}        — personal notifications for a user
 *   admin:{orgId}        — admin dashboard updates for an organization
 *   counter:{counterId}  — counter-specific events
 */

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // ── Join a branch room (for branch-wide queue updates) ──
    socket.on('join:branch', (branchId) => {
      socket.join(`branch:${branchId}`);
      console.log(`   └─ ${socket.id} joined branch:${branchId}`);
    });

    // ── Join a service queue room (for service-specific updates) ──
    socket.on('join:queue', (serviceId) => {
      socket.join(`queue:${serviceId}`);
      console.log(`   └─ ${socket.id} joined queue:${serviceId}`);
    });

    // ── Join personal notification room ──
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`   └─ ${socket.id} joined user:${userId}`);
    });

    // ── Join admin dashboard room ──
    socket.on('join:admin', (orgId) => {
      socket.join(`admin:${orgId}`);
      console.log(`   └─ ${socket.id} joined admin:${orgId}`);
    });

    // ── Join counter room (for staff) ──
    socket.on('join:counter', (counterId) => {
      socket.join(`counter:${counterId}`);
      console.log(`   └─ ${socket.id} joined counter:${counterId}`);
    });

    // ── Leave rooms ──
    socket.on('leave:branch', (branchId) => {
      socket.leave(`branch:${branchId}`);
    });

    socket.on('leave:queue', (serviceId) => {
      socket.leave(`queue:${serviceId}`);
    });

    socket.on('leave:admin', (orgId) => {
      socket.leave(`admin:${orgId}`);
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      console.log(`⚡ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initializeSocket;
