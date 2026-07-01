/**
 * QLess Database Seed Script
 * 
 * Creates demo data for:
 *   - 3 Organizations (Apollo Hospital, SBI Bank, Passport Office)
 *   - Branches, Services, Counters
 *   - Demo users for every role
 * 
 * Run: npm run seed
 * All demo passwords: password123
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const seed = async () => {
  const connection = await pool.getConnection();

  try {
    console.log('\n🌱 QLess Database Seeder');
    console.log('========================\n');

    await connection.beginTransaction();

    // ── Clear existing data (in reverse FK order) ──
    console.log('🗑️  Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE audit_logs');
    await connection.query('TRUNCATE TABLE notifications');
    await connection.query('TRUNCATE TABLE tokens');
    await connection.query('TRUNCATE TABLE counters');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('TRUNCATE TABLE services');
    await connection.query('TRUNCATE TABLE branches');
    await connection.query('TRUNCATE TABLE organizations');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // ── Hash password ──
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // ══════════════════════════════════════════════
    // 1. ORGANIZATIONS
    // ══════════════════════════════════════════════
    console.log('🏢 Creating organizations...');

    const [org1] = await connection.query(
      'INSERT INTO organizations (name, slug, address, phone, email) VALUES (?, ?, ?, ?, ?)',
      ['Apollo Hospital', 'apollo-hospital', 'Bannerghatta Road, Bangalore, Karnataka 560076', '+91-80-2630-4050', 'info@apollohospital.com']
    );

    const [org2] = await connection.query(
      'INSERT INTO organizations (name, slug, address, phone, email) VALUES (?, ?, ?, ?, ?)',
      ['SBI Bank', 'sbi-bank', 'MG Road, Bangalore, Karnataka 560001', '+91-80-2558-1144', 'info@sbibank.com']
    );

    const [org3] = await connection.query(
      'INSERT INTO organizations (name, slug, address, phone, email) VALUES (?, ?, ?, ?, ?)',
      ['Passport Office', 'passport-office', 'Lalbagh Road, Bangalore, Karnataka 560004', '+91-80-2221-3344', 'info@passportoffice.gov.in']
    );

    // ══════════════════════════════════════════════
    // 2. BRANCHES
    // ══════════════════════════════════════════════
    console.log('🏥 Creating branches...');

    const [apolloBranch] = await connection.query(
      'INSERT INTO branches (organization_id, name, address, phone) VALUES (?, ?, ?, ?)',
      [org1.insertId, 'Bangalore Main Branch', 'Bannerghatta Road, Bangalore', '+91-80-2630-4050']
    );

    const [sbiBranch] = await connection.query(
      'INSERT INTO branches (organization_id, name, address, phone) VALUES (?, ?, ?, ?)',
      [org2.insertId, 'MG Road Branch', 'MG Road, Bangalore', '+91-80-2558-1144']
    );

    const [passportBranch] = await connection.query(
      'INSERT INTO branches (organization_id, name, address, phone) VALUES (?, ?, ?, ?)',
      [org3.insertId, 'Bangalore Regional Office', 'Lalbagh Road, Bangalore', '+91-80-2221-3344']
    );

    // ══════════════════════════════════════════════
    // 3. SERVICES
    // ══════════════════════════════════════════════
    console.log('🩺 Creating services...');

    // Apollo Hospital Services
    const apolloServices = [
      ['Cardiology', 'CAR', 15],
      ['General Consultation', 'CON', 10],
      ['Lab Test', 'LAB', 8],
      ['Pharmacy', 'PHR', 5]
    ];

    const apolloServiceIds = [];
    for (const [name, prefix, avgTime] of apolloServices) {
      const [result] = await connection.query(
        'INSERT INTO services (organization_id, branch_id, name, prefix, avg_service_time) VALUES (?, ?, ?, ?, ?)',
        [org1.insertId, apolloBranch.insertId, name, prefix, avgTime]
      );
      apolloServiceIds.push(result.insertId);
    }

    // SBI Bank Services
    const sbiServices = [
      ['Account Opening', 'ACC', 20],
      ['Cash Deposit', 'DEP', 5],
      ['Loan Enquiry', 'LON', 25],
      ['General Enquiry', 'GEN', 10]
    ];

    for (const [name, prefix, avgTime] of sbiServices) {
      await connection.query(
        'INSERT INTO services (organization_id, branch_id, name, prefix, avg_service_time) VALUES (?, ?, ?, ?, ?)',
        [org2.insertId, sbiBranch.insertId, name, prefix, avgTime]
      );
    }

    // Passport Office Services
    const passportServices = [
      ['New Passport', 'NEW', 30],
      ['Passport Renewal', 'REN', 20],
      ['Tatkal Service', 'TAT', 15],
      ['Document Verification', 'DOC', 10]
    ];

    for (const [name, prefix, avgTime] of passportServices) {
      await connection.query(
        'INSERT INTO services (organization_id, branch_id, name, prefix, avg_service_time) VALUES (?, ?, ?, ?, ?)',
        [org3.insertId, passportBranch.insertId, name, prefix, avgTime]
      );
    }

    // ══════════════════════════════════════════════
    // 4. USERS
    // ══════════════════════════════════════════════
    console.log('👤 Creating users...');

    // Super Admin (platform owner — no organization)
    const [superAdmin] = await connection.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['Platform Admin', 'superadmin@qless.com', hashedPassword, 'super_admin', '+91-9000000000']
    );

    // Apollo Hospital Admin
    await connection.query(
      'INSERT INTO users (name, email, password, role, phone, organization_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Dr. Rajesh Kumar', 'admin@apollo.com', hashedPassword, 'admin', '+91-9000000001', org1.insertId, apolloBranch.insertId]
    );

    // Apollo Hospital Staff (4 counter staff)
    const staffNames = [
      ['Dr. Priya Sharma', 'staff1@apollo.com', '+91-9000000010'],
      ['Dr. Amit Patel', 'staff2@apollo.com', '+91-9000000011'],
      ['Nurse Kavitha', 'staff3@apollo.com', '+91-9000000012'],
      ['Pharmacist Ravi', 'staff4@apollo.com', '+91-9000000013']
    ];

    const staffIds = [];
    for (const [name, email, phone] of staffNames) {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password, role, phone, organization_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, 'staff', phone, org1.insertId, apolloBranch.insertId]
      );
      staffIds.push(result.insertId);
    }

    // Customer (no organization — they pick one when booking)
    await connection.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['John Doe', 'customer@example.com', hashedPassword, 'customer', '+91-9876543210']
    );

    // ── SBI Bank Admin ──────────────────────────────
    await connection.query(
      'INSERT INTO users (name, email, password, role, phone, organization_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Suresh Mehta', 'admin@sbi.com', hashedPassword, 'admin', '+91-9000000002', org2.insertId, sbiBranch.insertId]
    );

    // SBI Bank Staff (4 counter staff)
    const sbiStaffNames = [
      ['Anita Sharma',   'staff1@sbi.com', '+91-9000000020'],
      ['Rajan Verma',    'staff2@sbi.com', '+91-9000000021'],
      ['Meena Nair',     'staff3@sbi.com', '+91-9000000022'],
      ['Deepak Singh',   'staff4@sbi.com', '+91-9000000023']
    ];

    const sbiStaffIds = [];
    for (const [name, email, phone] of sbiStaffNames) {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password, role, phone, organization_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, 'staff', phone, org2.insertId, sbiBranch.insertId]
      );
      sbiStaffIds.push(result.insertId);
    }

    // SBI Bank Services IDs (in order of insertion: ACC, DEP, LON, GEN)
    const [sbiServiceRows] = await connection.query(
      'SELECT id FROM services WHERE organization_id = ? ORDER BY id', [org2.insertId]
    );
    const sbiServiceIds = sbiServiceRows.map(r => r.id);

    // ── Passport Office Admin ───────────────────────
    await connection.query(
      'INSERT INTO users (name, email, password, role, phone, organization_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Kavya Reddy', 'admin@passport.com', hashedPassword, 'admin', '+91-9000000003', org3.insertId, passportBranch.insertId]
    );

    // Passport Office Staff (4 counter staff)
    const passportStaffNames = [
      ['Arjun Nair',     'staff1@passport.com', '+91-9000000030'],
      ['Preethi Das',    'staff2@passport.com', '+91-9000000031'],
      ['Vikram Iyer',    'staff3@passport.com', '+91-9000000032'],
      ['Sunita Rao',     'staff4@passport.com', '+91-9000000033']
    ];

    const passportStaffIds = [];
    for (const [name, email, phone] of passportStaffNames) {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password, role, phone, organization_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, 'staff', phone, org3.insertId, passportBranch.insertId]
      );
      passportStaffIds.push(result.insertId);
    }

    // Passport Services IDs (in order: NEW, REN, TAT, DOC)
    const [passportServiceRows] = await connection.query(
      'SELECT id FROM services WHERE organization_id = ? ORDER BY id', [org3.insertId]
    );
    const passportServiceIds = passportServiceRows.map(r => r.id);

    // ══════════════════════════════════════════════
    // 5. COUNTERS
    // ══════════════════════════════════════════════
    console.log('🖥️  Creating counters...');

    // Apollo Hospital Counters
    const apolloCounters = [
      ['Counter 1 - Cardiology',     staffIds[0], apolloServiceIds[0]],
      ['Counter 2 - Consultation',   staffIds[1], apolloServiceIds[1]],
      ['Counter 3 - Lab Tests',      staffIds[2], apolloServiceIds[2]],
      ['Counter 4 - Pharmacy',       staffIds[3], apolloServiceIds[3]]
    ];
    for (const [name, staffId, serviceId] of apolloCounters) {
      await connection.query(
        'INSERT INTO counters (organization_id, branch_id, name, staff_id, service_id) VALUES (?, ?, ?, ?, ?)',
        [org1.insertId, apolloBranch.insertId, name, staffId, serviceId]
      );
    }

    // SBI Bank Counters
    const sbiCounters = [
      ['Counter A - Account Opening', sbiStaffIds[0], sbiServiceIds[0]],
      ['Counter B - Cash Deposit',    sbiStaffIds[1], sbiServiceIds[1]],
      ['Counter C - Loan Enquiry',    sbiStaffIds[2], sbiServiceIds[2]],
      ['Counter D - General Enquiry', sbiStaffIds[3], sbiServiceIds[3]]
    ];
    for (const [name, staffId, serviceId] of sbiCounters) {
      await connection.query(
        'INSERT INTO counters (organization_id, branch_id, name, staff_id, service_id) VALUES (?, ?, ?, ?, ?)',
        [org2.insertId, sbiBranch.insertId, name, staffId, serviceId]
      );
    }

    // Passport Office Counters
    const passportCounters = [
      ['Window 1 - New Passport',      passportStaffIds[0], passportServiceIds[0]],
      ['Window 2 - Renewal',           passportStaffIds[1], passportServiceIds[1]],
      ['Window 3 - Tatkal',            passportStaffIds[2], passportServiceIds[2]],
      ['Window 4 - Doc Verification',  passportStaffIds[3], passportServiceIds[3]]
    ];
    for (const [name, staffId, serviceId] of passportCounters) {
      await connection.query(
        'INSERT INTO counters (organization_id, branch_id, name, staff_id, service_id) VALUES (?, ?, ?, ?, ?)',
        [org3.insertId, passportBranch.insertId, name, staffId, serviceId]
      );
    }

    await connection.commit();

    console.log('\n✅ Seed completed successfully!\n');
    console.log('┌────────────────────────────────────────────────────┐');
    console.log('│              DEMO LOGIN CREDENTIALS                │');
    console.log('├────────────────────────────────────────────────────┤');
    console.log('│  SUPER ADMIN                                       │');
    console.log('│    superadmin@qless.com                            │');
    console.log('├────────────────────────────────────────────────────┤');
    console.log('│  APOLLO HOSPITAL                                   │');
    console.log('│    Admin : admin@apollo.com                        │');
    console.log('│    Staff : staff1@apollo.com  (Cardiology)         │');
    console.log('│    Staff : staff2@apollo.com  (Consultation)       │');
    console.log('│    Staff : staff3@apollo.com  (Lab Tests)          │');
    console.log('│    Staff : staff4@apollo.com  (Pharmacy)           │');
    console.log('├────────────────────────────────────────────────────┤');
    console.log('│  SBI BANK                                          │');
    console.log('│    Admin : admin@sbi.com                           │');
    console.log('│    Staff : staff1@sbi.com     (Account Opening)    │');
    console.log('│    Staff : staff2@sbi.com     (Cash Deposit)       │');
    console.log('│    Staff : staff3@sbi.com     (Loan Enquiry)       │');
    console.log('│    Staff : staff4@sbi.com     (General Enquiry)    │');
    console.log('├────────────────────────────────────────────────────┤');
    console.log('│  PASSPORT OFFICE                                   │');
    console.log('│    Admin : admin@passport.com                      │');
    console.log('│    Staff : staff1@passport.com (New Passport)      │');
    console.log('│    Staff : staff2@passport.com (Renewal)           │');
    console.log('│    Staff : staff3@passport.com (Tatkal)            │');
    console.log('│    Staff : staff4@passport.com (Doc Verification)  │');
    console.log('├────────────────────────────────────────────────────┤');
    console.log('│  CUSTOMER                                          │');
    console.log('│    customer@example.com                            │');
    console.log('│                                                    │');
    console.log('│  Password for ALL accounts : password123           │');
    console.log('└────────────────────────────────────────────────────┘\n');


    process.exit(0);
  } catch (err) {
    await connection.rollback();
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    connection.release();
  }
};

seed();
