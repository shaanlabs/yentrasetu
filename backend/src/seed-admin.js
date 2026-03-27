/**
 * Seed script — creates a default admin user for development.
 * Run with:  node src/seed-admin.js
 */
const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const ADMIN_PHONE = '9000000001';
    const ADMIN_PASSWORD = 'admin@123';

    // Check if user exists
    const [existing] = await sequelize.query(
      `SELECT id, userType FROM users WHERE phone = '${ADMIN_PHONE}' AND deletedAt IS NULL`
    );

    if (existing.length > 0) {
      const row = existing[0];
      if (row.userType !== 'admin') {
        await sequelize.query(`UPDATE users SET userType = 'admin' WHERE id = '${row.id}'`);
        console.log('✅ Existing user promoted to admin');
      } else {
        console.log('ℹ️  Admin user already exists');
      }
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const now = new Date().toISOString();

      await sequelize.query(`
        INSERT INTO users (id, phone, password, firstName, lastName, email, userType, accountTier, isVerified, isActive, isBanned, rating, reviewCount, createdAt, updatedAt)
        VALUES ('${id}', '${ADMIN_PHONE}', '${hashedPassword}', 'Admin', 'User', 'admin@yantrasetu.dev', 'admin', 'free', 1, 1, 0, 0, 0, '${now}', '${now}')
      `);
      console.log('✅ Admin user created');
    }

    console.log('\n🔑 Admin Credentials:');
    console.log(`   Phone:    ${ADMIN_PHONE}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('');

    await sequelize.close();
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seedAdmin();
