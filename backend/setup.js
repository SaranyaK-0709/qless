const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const runSetup = async () => {
  console.log('\n🏁 Starting QLess Database Auto-Setup...');
  console.log('====================================');
  
  // 1. Connect without db to verify MySQL server is running and create db
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT) || 3306,
      multipleStatements: true // Required to run all schema queries at once
    });
    console.log('✅ Connected to MySQL Server.');
  } catch (err) {
    console.error('\n❌ Failed to connect to MySQL Server:', err.message);
    console.error('   Please make sure your MySQL server is running.');
    console.error('   If it has a password, set DB_PASSWORD in backend/.env before running this script.\n');
    process.exit(1);
  }

  try {
    // 2. Create database
    await connection.query('CREATE DATABASE IF NOT EXISTS qless;');
    console.log('✅ Database "qless" verified/created.');
    await connection.query('USE qless;');

    // 3. Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Strip database creation queries from sql file to prevent conflicts
    const cleanSql = schemaSql
      .replace(/CREATE DATABASE IF NOT EXISTS qless;/gi, '')
      .replace(/USE qless;/gi, '');

    await connection.query(cleanSql);
    console.log('✅ Schema tables imported successfully.');

    // 4. Seed database
    console.log('🌱 Seeding demo dataset...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE audit_logs;');
    await connection.query('TRUNCATE TABLE notifications;');
    await connection.query('TRUNCATE TABLE tokens;');
    await connection.query('TRUNCATE TABLE counters;');
    await connection.query('TRUNCATE TABLE users;');
    await connection.query('TRUNCATE TABLE services;');
    await connection.query('TRUNCATE TABLE branches;');
    await connection.query('TRUNCATE TABLE organizations;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Organizations
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

    // Branches
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

    // Services
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

    // Users
    await connection.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['Platform Admin', 'superadmin@qless.com', hashedPassword, 'super_admin', '+91-9000000000']
    );

    await connection.query(
      'INSERT INTO users (name, email, password, role, phone, organization_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Dr. Rajesh Kumar', 'admin@apollo.com', hashedPassword, 'admin', '+91-9000000001', org1.insertId, apolloBranch.insertId]
    );

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

    await connection.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['John Doe', 'customer@example.com', hashedPassword, 'customer', '+91-9876543210']
    );

    // Counters
    const counters = [
      ['Counter 1', staffIds[0], apolloServiceIds[0]],
      ['Counter 2', staffIds[1], apolloServiceIds[1]],
      ['Counter 3', staffIds[2], apolloServiceIds[2]],
      ['Counter 4', staffIds[3], apolloServiceIds[3]]
    ];

    for (const [name, staffId, serviceId] of counters) {
      await connection.query(
        'INSERT INTO counters (organization_id, branch_id, name, staff_id, service_id) VALUES (?, ?, ?, ?, ?)',
        [org1.insertId, apolloBranch.insertId, name, staffId, serviceId]
      );
    }

    console.log('✅ Database tables initialized and seeded successfully!');
    console.log('====================================\n');
  } catch (err) {
    console.error('\n❌ Database setup error:', err.message);
  } finally {
    await connection.end();
  }
};

runSetup();
