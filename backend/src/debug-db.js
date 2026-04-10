const { sequelize } = require('./config/database');
const { User } = require('./models');

async function debug() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected');
    
    console.log('Model User Table Name:', User.getTableName());
    
    // Try a raw query to see what tables exist
    const [results] = await sequelize.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Existing Tables:', results.map(r => r.tablename));
    
    // Try to sync just User
    await User.sync({ force: true });
    console.log('✅ User sync successful');
    
  } catch (err) {
    console.error('❌ Debug Failed:', err.message);
  } finally {
    await sequelize.close();
  }
}

debug();
