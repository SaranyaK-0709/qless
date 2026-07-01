const pool = require('../config/db');

/**
 * GET /api/organizations
 * List all active organizations
 */
const getOrganizations = async (req, res) => {
  try {
    const [orgs] = await pool.query(
      'SELECT id, name, slug, logo_url FROM organizations WHERE is_active = TRUE ORDER BY name'
    );
    res.json({ success: true, organizations: orgs });
  } catch (err) {
    console.error('getOrganizations error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving organizations.' });
  }
};

/**
 * GET /api/organizations/:orgId/branches
 * List active branches for an organization
 */
const getBranches = async (req, res) => {
  try {
    const { orgId } = req.params;
    const [branches] = await pool.query(
      'SELECT id, name, address, phone FROM branches WHERE organization_id = ? AND is_active = TRUE ORDER BY name',
      [orgId]
    );
    res.json({ success: true, branches });
  } catch (err) {
    console.error('getBranches error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving branches.' });
  }
};

/**
 * GET /api/branches/:branchId/services
 * List active services for a branch
 */
const getServices = async (req, res) => {
  try {
    const { branchId } = req.params;
    const [services] = await pool.query(
      'SELECT id, name, prefix, avg_service_time FROM services WHERE branch_id = ? AND is_active = TRUE ORDER BY name',
      [branchId]
    );
    res.json({ success: true, services });
  } catch (err) {
    console.error('getServices error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving services.' });
  }
};

module.exports = {
  getOrganizations,
  getBranches,
  getServices
};
