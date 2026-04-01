/**
 * Seed script — creates machinery listings with real images for testing.
 * Run with:  node src/seed-listings.js
 *
 * Reads images from app/public/images, converts them to base64,
 * and creates one listing per image assigned round-robin to
 * contractor, company, and dealer users.
 */
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./config/database');
const User = require('./models/User');
const MachineryListing = require('./models/MachineryListing');

// Map each image file to realistic listing data
const IMAGE_LISTINGS = [
  {
    imageFile: 'category_excavators.jpg',
    listingType: 'sale',
    category: 'construction',
    subCategory: 'Excavator',
    make: 'JCB',
    model: 'JS205LC',
    year: 2021,
    hoursUsed: 3200,
    condition: 'used',
    price: 3500000,
    description: 'Well-maintained JCB JS205LC excavator with 3200 hours. Hydraulics recently serviced. Undercarriage in excellent condition. Ready for immediate deployment on any construction site.',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
  },
  {
    imageFile: 'category_cranes.jpg',
    listingType: 'sale',
    category: 'construction',
    subCategory: 'Crane',
    make: 'ACE',
    model: 'FX150',
    year: 2020,
    hoursUsed: 4100,
    condition: 'used',
    price: 4800000,
    description: 'ACE FX150 mobile crane with 15-ton lifting capacity. All safety certifications valid. Outriggers and hydraulic systems in perfect working order.',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380001',
  },
  {
    imageFile: 'category_dumpers.jpg',
    listingType: 'sale',
    category: 'mining',
    subCategory: 'Dumper',
    make: 'BharatBenz',
    model: '2528C',
    year: 2022,
    hoursUsed: 1800,
    condition: 'used',
    price: 2800000,
    description: 'BharatBenz 2528C heavy duty tipper with only 1800 hours. Ideal for mining and quarry operations. New tyres fitted recently. All papers current.',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
  },
  {
    imageFile: 'featured_tata_hitachi.jpg',
    listingType: 'sale',
    category: 'construction',
    subCategory: 'Excavator',
    make: 'Tata Hitachi',
    model: 'EX200',
    year: 2019,
    hoursUsed: 5500,
    condition: 'used',
    price: 4200000,
    isFeatured: true,
    description: 'Tata Hitachi EX200 — flagship 20-ton excavator. Bucket capacity 0.8 m³. Engine recently overhauled. Certified inspection report available. Delivery within Maharashtra included.',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
  {
    imageFile: 'featured_ace_crane.jpg',
    listingType: 'rent',
    category: 'construction',
    subCategory: 'Tower Crane',
    make: 'ACE',
    model: '14XW',
    year: 2021,
    hoursUsed: 2800,
    condition: 'used',
    price: 85000,
    rentalUnit: 'monthly',
    securityDeposit: 200000,
    minimumRentalDuration: 30,
    withOperator: true,
    operatorRate: 1500,
    isFeatured: true,
    description: 'ACE 14XW tower crane available for monthly rental. Comes with experienced operator. Max jib length 50m, max capacity 6 tons. Ideal for high-rise construction projects.',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  },
  {
    imageFile: 'featured_hyundai.jpg',
    listingType: 'sale',
    category: 'construction',
    subCategory: 'Excavator',
    make: 'Hyundai',
    model: 'R140',
    year: 2020,
    hoursUsed: 4000,
    condition: 'used',
    price: 3800000,
    isFeatured: true,
    description: 'Hyundai R140 mid-size excavator in excellent condition. Cummins engine, 4000 hours. AC cabin, ROPS/FOPS certified. All maintenance records available.',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
  },
  {
    imageFile: 'financing_machine.jpg',
    listingType: 'rent',
    category: 'construction',
    subCategory: 'Backhoe Loader',
    make: 'CASE',
    model: '770EX',
    year: 2022,
    hoursUsed: 1200,
    condition: 'used',
    price: 45000,
    rentalUnit: 'monthly',
    securityDeposit: 100000,
    minimumRentalDuration: 15,
    withOperator: false,
    description: 'CASE 770EX backhoe loader on monthly rental. Low hours, excellent condition. Perfect for road construction and utility work. Delivery available within 100 km.',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    deliveryAvailable: true,
    deliveryRadius: 100,
  },
  {
    imageFile: 'hero_excavator.jpg',
    listingType: 'sale',
    category: 'construction',
    subCategory: 'Excavator',
    make: 'Komatsu',
    model: 'PC210',
    year: 2018,
    hoursUsed: 7200,
    condition: 'used',
    price: 3200000,
    description: 'Komatsu PC210 — reliable 21-ton excavator with 7200 hours. Solid workhorse for earthmoving projects. Engine and hydraulics in good shape. Priced to sell.',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
  },
  {
    imageFile: 'howitworks_operator.jpg',
    listingType: 'rent',
    category: 'construction',
    subCategory: 'Excavator',
    make: 'Volvo',
    model: 'EC210D',
    year: 2021,
    hoursUsed: 2600,
    condition: 'used',
    price: 95000,
    rentalUnit: 'monthly',
    securityDeposit: 250000,
    minimumRentalDuration: 30,
    withOperator: true,
    operatorRate: 1800,
    description: 'Volvo EC210D excavator with skilled operator. Premium cabin, low emissions. Available for long-term rental on metro and infra projects.',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
  },
  {
    imageFile: 'valueprops_machine.jpg',
    listingType: 'sale',
    category: 'mining',
    subCategory: 'Wheel Loader',
    make: 'Caterpillar',
    model: '950GC',
    year: 2020,
    hoursUsed: 3800,
    condition: 'used',
    price: 5500000,
    description: 'CAT 950GC wheel loader — 5-ton payload, 3.2 m³ bucket. Perfect for quarry, port, and mining applications. Regular dealer servicing. All emission norms complied.',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
  },
  {
    imageFile: 'safety_quarry.jpg',
    listingType: 'sale',
    category: 'mining',
    subCategory: 'Rock Breaker',
    make: 'Atlas Copco',
    model: 'HB3600',
    year: 2019,
    hoursUsed: 4500,
    condition: 'used',
    price: 2200000,
    description: 'Atlas Copco HB3600 hydraulic rock breaker. Mounted on 30-ton carrier. Chisel recently replaced. Ideal for quarry and demolition work.',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pincode: '492001',
  },
  {
    imageFile: 'testimonial_portrait.jpg',
    listingType: 'rent',
    category: 'industrial',
    subCategory: 'Generator',
    make: 'Kirloskar',
    model: 'KG1-62.5AS',
    year: 2023,
    hoursUsed: 500,
    condition: 'used',
    price: 25000,
    rentalUnit: 'monthly',
    securityDeposit: 50000,
    minimumRentalDuration: 7,
    withOperator: false,
    description: 'Kirloskar 62.5 kVA silent generator set on monthly rental. Almost new — only 500 hours. Perfect backup power for construction sites and events.',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226001',
  },
];

// Roles that own listings
const LISTING_ROLES = ['contractor', 'company', 'dealer'];

async function seedListings() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync();

    // Fetch one user per listing role
    const ownerUsers = [];
    for (const role of LISTING_ROLES) {
      const user = await User.findOne({ where: { userType: role, isActive: true } });
      if (user) {
        ownerUsers.push(user);
        console.log(`✅ Found ${role} user: ${user.firstName} ${user.lastName} (${user.phone})`);
      } else {
        console.warn(`⚠️  No ${role} user found — run seed-users.js first`);
      }
    }

    if (ownerUsers.length === 0) {
      console.error('❌ No contractor/company/dealer users found. Run seed-users.js first.');
      process.exit(1);
    }

    // Resolve images directory with fallback
    let imagesDir = path.resolve(__dirname, '../../app/public/images');
    if (!fs.existsSync(imagesDir)) {
      // Fallback for Render/production environments where the path might differ
      imagesDir = path.resolve(__dirname, '../seeds/images');
    }
    
    console.log(`📂 Searching for images in: ${imagesDir}`);
    
    let createdCount = 0;
    let skippedCount = 0;
    const createdListings = [];

    for (let idx = 0; idx < IMAGE_LISTINGS.length; idx++) {
      const listing = IMAGE_LISTINGS[idx];
      const owner = ownerUsers[idx % ownerUsers.length]; // round-robin

      // Read image and convert to base64
      const imgPath = path.join(imagesDir, listing.imageFile);
      if (!fs.existsSync(imgPath)) {
        console.warn(`⚠️  Image not found: ${listing.imageFile}, skipping`);
        skippedCount++;
        continue;
      }

      // Check if listing already exists (by make+model+userId)
      const existing = await MachineryListing.findOne({
        where: { make: listing.make, model: listing.model, userId: owner.id }
      });
      if (existing) {
        console.log(`ℹ️  Listing already exists: ${listing.make} ${listing.model} — skipping`);
        createdListings.push({
          make: listing.make,
          model: listing.model,
          owner: `${owner.firstName} ${owner.lastName}`,
          ownerRole: owner.userType,
          ownerPhone: owner.phone,
          price: listing.price,
          type: listing.listingType,
          status: 'existing',
        });
        skippedCount++;
        continue;
      }

      const imgBuffer = fs.readFileSync(imgPath);
      const base64 = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;

      await MachineryListing.create({
        userId: owner.id,
        listingType: listing.listingType,
        category: listing.category,
        subCategory: listing.subCategory,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        hoursUsed: listing.hoursUsed || null,
        condition: listing.condition,
        price: listing.price,
        priceNegotiable: true,
        description: listing.description,
        rentalUnit: listing.rentalUnit || null,
        securityDeposit: listing.securityDeposit || null,
        minimumRentalDuration: listing.minimumRentalDuration || null,
        withOperator: listing.withOperator || false,
        operatorRate: listing.operatorRate || null,
        deliveryAvailable: listing.deliveryAvailable || false,
        deliveryRadius: listing.deliveryRadius || null,
        city: listing.city,
        state: listing.state,
        pincode: listing.pincode || null,
        status: 'approved',
        isVerified: true,
        isFeatured: listing.isFeatured || false,
        isActive: true,
        images: [base64],
        viewCount: Math.floor(Math.random() * 200) + 20,
        contactUnlockCount: Math.floor(Math.random() * 15),
      });

      createdCount++;
      createdListings.push({
        make: listing.make,
        model: listing.model,
        owner: `${owner.firstName} ${owner.lastName}`,
        ownerRole: owner.userType,
        ownerPhone: owner.phone,
        price: listing.price,
        type: listing.listingType,
        status: 'created',
      });
      console.log(`✅ Created: ${listing.make} ${listing.model} → ${owner.userType} (${owner.phone})`);
    }

    // --- Update DEV_CREDENTIALS.md with listings info ---
    const credsPath = path.resolve(__dirname, '../../DEV_CREDENTIALS.md');
    if (fs.existsSync(credsPath)) {
      let md = fs.readFileSync(credsPath, 'utf-8');

      // Remove old listings section if present
      const listingsMarker = '## Seeded Listings';
      const markerIdx = md.indexOf(listingsMarker);
      if (markerIdx !== -1) {
        md = md.substring(0, markerIdx).trimEnd() + '\n\n';
      }

      // Append listings table
      md += `${listingsMarker} (${createdListings.length} total)\n\n`;
      md += `| # | Machine | Type | Price | Owner Role | Owner Phone |\n`;
      md += `|---|---------|------|-------|------------|-------------|\n`;
      createdListings.forEach((l, i) => {
        const priceStr = l.type === 'rent'
          ? `₹${Number(l.price).toLocaleString('en-IN')}/mo`
          : `₹${Number(l.price).toLocaleString('en-IN')}`;
        md += `| ${i + 1} | ${l.make} ${l.model} | ${l.type} | ${priceStr} | ${l.ownerRole} | \`${l.ownerPhone}\` |\n`;
      });
      md += '\n';

      fs.writeFileSync(credsPath, md, 'utf-8');
      console.log(`\n📄 Listings appended to ${credsPath}`);
    }

    console.log(`\n🎉 Listing seed done! Created: ${createdCount}, Skipped: ${skippedCount}`);

    await sequelize.close();
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seedListings();
