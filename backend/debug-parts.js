const { PartListing, User, sequelize } = require('./src/models');

async function debugParts() {
  try {
    console.log('--- Debugging Parts Query ---');
    const parts = await PartListing.findAndCountAll({
      where: { status: 'active', isActive: true },
      include: [{ 
        model: User, 
        as: 'seller', 
        attributes: ['id', 'firstName', 'lastName'] 
      }]
    });
    console.log('✅ Query Success! Count:', parts.count);
  } catch (err) {
    console.error('❌ Query Failed!');
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

debugParts();
