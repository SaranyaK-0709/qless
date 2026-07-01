const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  bookToken,
  getTokenDetails,
  getLiveQueue,
  callNext,
  startService,
  completeService,
  skipService,
  getUserActiveTokens,
  getStaffCounterStatus
} = require('../controllers/tokenController');

router.post('/book', auth, bookToken);
router.get('/user/active', auth, getUserActiveTokens);
router.get('/staff/counter-status', auth, authorize('staff', 'admin'), getStaffCounterStatus);
router.get('/:tokenId', getTokenDetails);
router.get('/live/service/:serviceId', getLiveQueue);

// Staff/Admin actions
router.post('/call', auth, authorize('staff', 'admin'), callNext);
router.post('/:tokenId/start', auth, authorize('staff', 'admin'), startService);
router.post('/:tokenId/complete', auth, authorize('staff', 'admin'), completeService);
router.post('/:tokenId/skip', auth, authorize('staff', 'admin'), skipService);

module.exports = router;
