const express = require('express');
const router = express.Router();
const { getOrganizations, getBranches, getServices } = require('../controllers/organizationController');

router.get('/', getOrganizations);
router.get('/:orgId/branches', getBranches);
router.get('/branches/:branchId/services', getServices);

module.exports = router;
