/**
 * seed-comprehensive.js
 * Creates a rich set of dummy data across all core entities:
 * 1. Users (Contractors, Dealers, Companies, Operators, Mechanics)
 * 2. Machinery Listings
 * 3. Part Listings
 * 4. Operator & Mechanic Profiles
 * 5. Subscriptions for Dealers
 * 6. Certification Requests
 */

const path = require('path');
const fs = require('fs');
const { sequelize } = require('./config/database');
const { 
  User, 
  MachineryListing, 
  PartListing, 
  OperatorProfile, 
  MechanicProfile, 
  Subscription,
  CertificationRequest 
} = require('./models');

const DEFAULT_PASSWORD = 'password123';

const PARTS_DATA = [
  { partName: 'Engine Oil Filter', partNumber: 'OF-1002', oemPartNumber: 'JCB-770-OF', category: 'engine', condition: 'new', price: 1200, description: 'Genuine JCB engine oil filter for 770EX.', city: 'Pune', state: 'Maharashtra' },
  { partName: 'Hydraulic Seal Kit', partNumber: 'HSK-45', oemPartNumber: 'VOLVO-EC210-HS', category: 'hydraulics', condition: 'oem', price: 3500, description: 'OEM hydraulic seal kit for Volvo EC210 boom cylinder.', city: 'Bengaluru', state: 'Karnataka' },
  { partName: 'Track Link Assembly', partNumber: 'TLA-600', oemPartNumber: 'KOM-PC210-TL', category: 'undercarriage', condition: 'aftermarket', price: 45000, description: 'High-durability track link for Komatsu PC210.', city: 'Dhanbad', state: 'Jharkhand' },
  { partName: 'Boom Light LED', partNumber: 'LED-BM-12', oemPartNumber: 'GEN-LED-01', category: 'electrical', condition: 'new', price: 850, description: 'Super bright LED boom light for nighttime operations.', city: 'Gurugram', state: 'Haryana' },
];

async function seedComprehensive() {
  try {
    console.log('✅ Connected to database');
    // Force sync with logging to identify naming issues
    await sequelize.sync({ force: true, logging: console.log });

    // 1. Seed Users (Reuse logic from seed-users.js)
    console.log('👤 Seeding Users...');
    const roles = ['individual', 'contractor', 'company', 'dealer', 'operator', 'mechanic', 'admin'];
    const users = [];

    for (const role of roles) {
      const email = `test_${role}@yantrasetu.dev`;
      const [user] = await User.findOrCreate({
        where: { email },
        defaults: {
          phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
          password: DEFAULT_PASSWORD,
          firstName: 'Seed',
          lastName: role.charAt(0).toUpperCase() + role.slice(1),
          userType: role,
          isVerified: true,
          isActive: true
        }
      });
      users.push(user);
    }
    console.log(`✅ Seeded ${users.length} users`);

    // 2. Seed Machinery (Reuse some logic from seed-listings.js)
    console.log('🚜 Seeding Machinery...');
    const dealer = users.find(u => u.userType === 'dealer');
    const contractor = users.find(u => u.userType === 'contractor');
    
    await MachineryListing.findOrCreate({
      where: { model: 'PC210-Mock' },
      defaults: {
        userId: dealer.id,
        listingType: 'sale',
        category: 'construction',
        subCategory: 'Excavator',
        make: 'Komatsu',
        model: 'PC210-Mock',
        year: 2021,
        condition: 'used',
        price: 3200000,
        city: 'Mumbai',
        state: 'Maharashtra',
        status: 'approved',
        isActive: true,
        images: []
      }
    });
    console.log('✅ Seeded machinery');

    // 3. Seed Parts
    console.log('⚙️ Seeding Parts...');
    for (const p of PARTS_DATA) {
      await PartListing.findOrCreate({
        where: { partNumber: p.partNumber },
        defaults: { ...p, userId: dealer.id }
      });
    }
    console.log('✅ Seeded parts');

    // 4. Seed Professional Profiles
    console.log('👨‍🔧 Seeding Profiles...');
    const opUser = users.find(u => u.userType === 'operator');
    const mechUser = users.find(u => u.userType === 'mechanic');

    await OperatorProfile.findOrCreate({
      where: { userId: opUser.id },
      defaults: {
        yearsOfExperience: 8,
        equipmentTypes: ['Excavator', 'Backhoe'],
        city: 'Delhi',
        state: 'Delhi',
        dayRate: 1500,
        isVerified: true,
        verificationStatus: 'approved'
      }
    });

    await MechanicProfile.findOrCreate({
      where: { userId: mechUser.id },
      defaults: {
        yearsOfExperience: 12,
        specializations: ['Engine', 'Hydraulics'],
        city: 'Nagpur',
        state: 'Maharashtra',
        hourlyRate: 400,
        isVerified: true,
        verificationStatus: 'approved'
      }
    });
    console.log('✅ Seeded profiles');

    // 5. Seed Subscriptions
    console.log('💳 Seeding Subscriptions...');
    await Subscription.findOrCreate({
      where: { userId: dealer.id, status: 'active' },
      defaults: {
        plan: 'growth',
        status: 'active',
        maxListings: 100, // Fixed field name
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    console.log('✅ Seeded subscriptions');

    // 6. Seed Certification Requests
    console.log('📜 Seeding Certifications...');
    await CertificationRequest.findOrCreate({
      where: { userId: opUser.id, status: 'pending' },
      defaults: {
        certificationType: 'DGMS', // Fixed field name
        documentName: 'DGMS Operator License', // Fixed field name
        documentImage: 'data:image/png;base64,...mock...', // Fixed field name
        status: 'pending'
      }
    });
    console.log('✅ Seeded certifications');

    console.log('\n🌟 Comprehensive seeding complete!');
    await sequelize.close();
  } catch (err) {
    console.error('❌ SEED FAILED:', err.message);
    process.exit(1);
  }
}

seedComprehensive();
