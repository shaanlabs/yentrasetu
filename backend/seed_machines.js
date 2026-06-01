const { Sequelize } = require('sequelize');
const { User, MachineryListing } = require('./src/models');
const { sequelize } = require('./src/config/database');

const categories = ['Construction', 'Concrete', 'Foundation', 'Mining', 'Agriculture', 'Industrial'];
const makes = ['Caterpillar', 'JCB', 'Komatsu', 'Volvo', 'Hitachi', 'Larsen & Toubro', 'SANY', 'Mahindra'];

function generateSvgImage(make, category, index) {
  const bgColor = ['#101214', '#1A202C', '#2D3748', '#4A5568'][index % 4];
  const accentColor = '#FF6A00';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="${bgColor}"/>
    <rect width="800" height="600" fill="url(#grid)" opacity="0.1"/>
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1"/>
      </pattern>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${bgColor}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#grad)"/>
    
    <g transform="translate(400, 250)" text-anchor="middle">
      <path d="M-60,0 L60,0 M0,-60 L0,60" stroke="${accentColor}" stroke-width="4" opacity="0.5"/>
      <circle cx="0" cy="0" r="40" fill="none" stroke="${accentColor}" stroke-width="8" opacity="0.8"/>
    </g>
    
    <text x="400" y="380" font-family="monospace" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${make.toUpperCase()}</text>
    <text x="400" y="440" font-family="sans-serif" font-size="24" fill="${accentColor}" text-anchor="middle">${category.toUpperCase()} EQUIPMENT</text>
    <text x="400" y="480" font-family="sans-serif" font-size="16" fill="#888" text-anchor="middle">ID: ${Math.random().toString(36).substring(7).toUpperCase()}</text>
  </svg>`;
  
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB...');

    // Find or create an admin user to own the listings
    let admin = await User.findOne({ where: { userType: 'admin' } });
    if (!admin) {
      admin = await User.create({
        phone: '9999999999',
        firstName: 'System',
        lastName: 'Admin',
        userType: 'admin',
        isVerified: true
      });
    }

    console.log('Creating machines...');
    let count = 0;

    for (const category of categories) {
      for (let i = 0; i < 10; i++) {
        const make = makes[Math.floor(Math.random() * makes.length)];
        const isSale = Math.random() > 0.5;
        
        const listing = {
          userId: admin.id,
          ownerId: admin.id,
          listingType: isSale ? 'sale' : 'rent',
          category: category,
          subCategory: 'Heavy Equipment',
          make: make,
          model: `Pro Series ${Math.floor(Math.random() * 9000) + 1000}`,
          year: 2015 + Math.floor(Math.random() * 9),
          hoursUsed: Math.floor(Math.random() * 10000),
          condition: 'used',
          city: 'Bengaluru',
          state: 'Karnataka',
          location: 'Bengaluru, Karnataka',
          latitude: 12.9716,
          longitude: 77.5946,
          images: [
            generateSvgImage(make, category, i),
            generateSvgImage(make, category, i+1)
          ],
          specifications: { weight: '20 Tons', engine: 'Diesel 200HP' },
          description: `A high quality ${make} machine for ${category} applications. Excellent condition.`,
          isVerified: Math.random() > 0.3,
          status: 'active',
          viewCount: Math.floor(Math.random() * 500)
        };

        if (isSale) {
          listing.price = 1500000 + Math.floor(Math.random() * 8500000);
        } else {
          listing.rentalRateDaily = 5000 + Math.floor(Math.random() * 10000);
          listing.rentalRateWeekly = listing.rentalRateDaily * 6;
          listing.rentalRateMonthly = listing.rentalRateDaily * 20;
          listing.price = listing.rentalRateDaily; // Base price for rent sorting
        }

        await MachineryListing.create(listing);
        count++;
      }
    }

    console.log(`Successfully seeded ${count} listings!`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
