/**
 * seed-massive.js
 * Creates 50+ entries for EVERY core category in the YantraSetu marketplace.
 * 
 * Categories seeded:
 *   1. Users             — 60 users across all roles
 *   2. Machinery (SALE)  — 55 listings
 *   3. Machinery (RENT)  — 55 listings
 *   4. Spare Parts       — 55 part listings
 *   5. Operator Profiles — 55 service profiles
 *   6. Mechanic Profiles — 55 service profiles
 *   7. Reviews           — 55 reviews
 *   8. Rental Bookings   — 55 bookings
 * 
 * Run:  node src/seed-massive.js
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
  Review,
  RentalBooking,
} = require('./models');

const DEFAULT_PASSWORD = 'password123';

// ─── Image Loading ───────────────────────────────────────────────────────────

const IMAGES_DIR = path.resolve(__dirname, '../../app/public/images');

// Map subCategory → unique image file(s) so every listing type looks distinct
const SUBCATEGORY_IMAGES = {
  // Construction
  'Excavator':      ['seed_excavator_1.png', 'category_excavators.jpg', 'hero_excavator.jpg', 'featured_tata_hitachi.jpg'],
  'Backhoe Loader': ['seed_backhoe_1.png', 'featured_hyundai.jpg'],
  'Crane':          ['seed_crane_1.png', 'featured_ace_crane.jpg', 'category_cranes.jpg'],
  'Tower Crane':    ['seed_tower_crane_1.png', 'category_cranes.jpg'],
  'Wheel Loader':   ['seed_loader_1.png', 'financing_machine.jpg'],
  'Bulldozer':      ['seed_bulldozer_1.png', 'valueprops_machine.jpg'],
  'Motor Grader':   ['seed_motor_grader_1.png'],
  'Compactor':      ['seed_compactor_1.png'],
  'Piling Rig':     ['seed_drilling_rig_1.png'],
  'Concrete Mixer': ['seed_concrete_mixer_1.png'],
  // Mining
  'Dumper':          ['seed_dumper_1.png', 'category_dumpers.jpg'],
  'Rock Breaker':    ['seed_drilling_rig_1.png', 'safety_quarry.jpg'],
  'Drilling Rig':    ['seed_drilling_rig_1.png'],
  'Surface Miner':   ['seed_dumper_1.png', 'safety_quarry.jpg'],
  'Screening Plant': ['safety_quarry.jpg', 'seed_dumper_1.png'],
  'Crusher':         ['safety_quarry.jpg', 'seed_drilling_rig_1.png'],
  'Dozer':           ['seed_bulldozer_1.png'],
  // Agriculture
  'Tractor':    ['seed_tractor_1.png', 'financing_machine.jpg'],
  'Harvester':  ['seed_harvester_1.png'],
  'Rotavator':  ['seed_tractor_1.png', 'howitworks_operator.jpg'],
  'Seed Drill': ['seed_tractor_1.png'],
  'Sprayer':    ['seed_tractor_1.png', 'seed_harvester_1.png'],
  'Plough':     ['seed_tractor_1.png'],
  // Industrial
  'Generator':       ['seed_generator_1.png'],
  'Compressor':      ['seed_compressor_1.png'],
  'Forklift':        ['seed_forklift_1.png'],
  'Welding Machine': ['seed_compressor_1.png', 'seed_generator_1.png'],
  'Boom Lift':       ['seed_boom_lift_1.png'],
  'Scissor Lift':    ['seed_boom_lift_1.png', 'seed_forklift_1.png'],
};

// Fallback images when subcategory is not matched
const FALLBACK_IMAGES = [
  'seed_excavator_1.png', 'seed_backhoe_1.png', 'seed_crane_1.png',
  'seed_bulldozer_1.png', 'seed_loader_1.png', 'seed_dumper_1.png',
  'seed_tractor_1.png', 'seed_generator_1.png', 'seed_forklift_1.png',
  'seed_drilling_rig_1.png', 'seed_compactor_1.png', 'seed_tower_crane_1.png',
  'seed_harvester_1.png', 'seed_concrete_mixer_1.png', 'seed_motor_grader_1.png',
  'seed_boom_lift_1.png', 'seed_compressor_1.png',
];

// All unique images for parts listings (wide pool for visual variety)
const PARTS_IMAGES = [
  'seed_excavator_1.png', 'seed_backhoe_1.png', 'seed_crane_1.png',
  'seed_bulldozer_1.png', 'seed_loader_1.png', 'seed_dumper_1.png',
  'seed_generator_1.png', 'seed_forklift_1.png', 'seed_drilling_rig_1.png',
  'seed_compactor_1.png', 'seed_compressor_1.png', 'seed_boom_lift_1.png',
  'category_excavators.jpg', 'category_cranes.jpg', 'category_dumpers.jpg',
  'featured_tata_hitachi.jpg', 'featured_hyundai.jpg', 'featured_ace_crane.jpg',
];

// Cache loaded images to avoid re-reading files
const imageCache = {};

function loadImageBase64(filename) {
  if (imageCache[filename]) return imageCache[filename];
  const imgPath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(imgPath)) {
    console.warn(`  ⚠️  Image not found: ${filename}`);
    return null;
  }
  const ext = path.extname(filename).slice(1).toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const buffer = fs.readFileSync(imgPath);
  const base64 = `data:${mime};base64,${buffer.toString('base64')}`;
  imageCache[filename] = base64;
  return base64;
}

function getImageForSubCategory(subCategory, index) {
  const files = SUBCATEGORY_IMAGES[subCategory] || FALLBACK_IMAGES;
  // Use index to pick different images within the subcategory pool
  const filename = files[index % files.length];
  return loadImageBase64(filename);
}

function getImageForCategory(category, index) {
  // Use fallback pool with offset per category for variety
  const catOffset = { construction: 0, mining: 4, agriculture: 6, industrial: 8 };
  const offset = catOffset[category] || 0;
  const filename = FALLBACK_IMAGES[(index + offset) % FALLBACK_IMAGES.length];
  return loadImageBase64(filename);
}

function getImageForPart(index) {
  const filename = PARTS_IMAGES[index % PARTS_IMAGES.length];
  return loadImageBase64(filename);
}

// ─── Helper Arrays ───────────────────────────────────────────────────────────

const INDIAN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', pin: '400001' },
  { city: 'Pune', state: 'Maharashtra', pin: '411001' },
  { city: 'Nagpur', state: 'Maharashtra', pin: '440001' },
  { city: 'Delhi', state: 'Delhi', pin: '110001' },
  { city: 'Noida', state: 'Uttar Pradesh', pin: '201301' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pin: '226001' },
  { city: 'Bengaluru', state: 'Karnataka', pin: '560001' },
  { city: 'Mysuru', state: 'Karnataka', pin: '570001' },
  { city: 'Chennai', state: 'Tamil Nadu', pin: '600001' },
  { city: 'Coimbatore', state: 'Tamil Nadu', pin: '641001' },
  { city: 'Hyderabad', state: 'Telangana', pin: '500001' },
  { city: 'Kolkata', state: 'West Bengal', pin: '700001' },
  { city: 'Ahmedabad', state: 'Gujarat', pin: '380001' },
  { city: 'Surat', state: 'Gujarat', pin: '395001' },
  { city: 'Jaipur', state: 'Rajasthan', pin: '302001' },
  { city: 'Udaipur', state: 'Rajasthan', pin: '313001' },
  { city: 'Bhopal', state: 'Madhya Pradesh', pin: '462001' },
  { city: 'Indore', state: 'Madhya Pradesh', pin: '452001' },
  { city: 'Chandigarh', state: 'Chandigarh', pin: '160001' },
  { city: 'Gurugram', state: 'Haryana', pin: '122001' },
  { city: 'Patna', state: 'Bihar', pin: '800001' },
  { city: 'Ranchi', state: 'Jharkhand', pin: '834001' },
  { city: 'Dhanbad', state: 'Jharkhand', pin: '826001' },
  { city: 'Raipur', state: 'Chhattisgarh', pin: '492001' },
  { city: 'Bhubaneswar', state: 'Odisha', pin: '751001' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', pin: '530001' },
  { city: 'Kochi', state: 'Kerala', pin: '682001' },
  { city: 'Thiruvananthapuram', state: 'Kerala', pin: '695001' },
  { city: 'Guwahati', state: 'Assam', pin: '781001' },
  { city: 'Dehradun', state: 'Uttarakhand', pin: '248001' },
];

const FIRST_NAMES = ['Rajesh', 'Sunil', 'Arun', 'Vijay', 'Manoj', 'Pradeep', 'Sanjay', 'Amit', 'Rakesh', 'Deepak', 'Ashok', 'Ramesh', 'Suresh', 'Mohan', 'Kishore', 'Naveen', 'Harish', 'Ganesh', 'Dinesh', 'Mukesh', 'Anand', 'Venkat', 'Krishna', 'Ravi', 'Prakash', 'Gopal', 'Vinod', 'Satish', 'Yogesh', 'Ajay'];
const LAST_NAMES = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Gupta', 'Verma', 'Yadav', 'Joshi', 'Mishra', 'Nair', 'Pillai', 'Das', 'Roy', 'Mehta', 'Shah', 'Thakur', 'Chauhan', 'Rao', 'Iyer', 'Tiwari', 'Pandey', 'Dubey', 'Saxena', 'Agarwal', 'Bhat', 'Hegde', 'Patil', 'Kulkarni', 'Deshmukh'];

// Machinery data pools
const MAKES_MODELS = {
  construction: [
    { make: 'JCB', models: ['JS205LC', 'JS210', '3DX Super', '4DX', 'JS305', 'VM117', 'JS120', 'JS140', 'Loadall 530-70', '550-80'] },
    { make: 'Tata Hitachi', models: ['EX200', 'EX110', 'EX70', 'ZX210', 'ZX330', 'ZAXIS 220', 'EX130', 'ZX120', 'EX210', 'EX350'] },
    { make: 'Komatsu', models: ['PC210', 'PC130', 'PC71', 'WA380', 'D65', 'PC300', 'GD675', 'WA470', 'PC200', 'PC450'] },
    { make: 'Volvo', models: ['EC210D', 'EC140', 'EC480', 'L120H', 'A25G', 'EC300', 'EC350', 'L150H', 'EC750', 'G990'] },
    { make: 'Caterpillar', models: ['320D', '330GC', '306', '950GC', 'D6T', '420F', '140M', '966H', '325', '345'] },
    { make: 'Hyundai', models: ['R140', 'R210', 'R55', 'HL760', 'R480', 'R170', 'R220', 'R80', 'R340', 'HL770'] },
    { make: 'CASE', models: ['770EX', 'CX210C', 'CX350D', '851EX', '580N', 'CX75C', 'CX130D', 'CX290D', '650L', '850M'] },
    { make: 'ACE', models: ['FX150', 'AX124', 'FX230', 'NX300', '14XW', 'TM25', 'FX180', 'AX130', 'FX270', 'NX400'] },
    { make: 'Liebherr', models: ['R920', 'R926', 'R946', 'L550', 'LTM 1100', 'R934', 'L538', 'R956', 'LTM 1300', 'L566'] },
    { make: 'Sany', models: ['SY215C', 'SY75C', 'SY135C', 'SY365H', 'STC250', 'SY205C', 'SCC600E', 'SY305H', 'SY500H', 'STM250'] },
  ],
  mining: [
    { make: 'BEML', models: ['BH150E', 'BD155', 'BH60MP', 'BD475-1', 'BD80', 'BH205', 'BD355', 'BH100', 'BD255', 'BH300'] },
    { make: 'Caterpillar', models: ['785D', '789D', '994K', 'D11T', '6060', '793F', '797F', 'D10T', '992K', '6030'] },
    { make: 'Komatsu', models: ['PC2000', 'PC1250', 'HD785-7', 'WA900', 'D375A', 'PC3000', 'HD605', 'WA800', 'D475A', 'PC4000'] },
    { make: 'Hitachi', models: ['EH3500', 'EX2600', 'EH1700', 'EX5600', 'EH4000', 'EX1900', 'EH5000', 'EX3600', 'EH1100', 'EX8000'] },
  ],
  agriculture: [
    { make: 'Mahindra', models: ['575 DI', '475 DI', 'JIVO 365', 'Arjun NOVO', '585 DI', '265 DI', '415 DI', 'Yuvo 575', '275 DI', 'Arjun 605'] },
    { make: 'TAFE', models: ['7502', '5900', '241 DI', '8502', '5502', '9502', '6510', '7510', '35 DI', '7500'] },
    { make: 'John Deere', models: ['5310', '5050D', '5210', '5405', '3028EN', '5105', '5075E', '5505', '6120B', '5045D'] },
    { make: 'Sonalika', models: ['DI 60', 'DI 745', 'DI 35', 'GT 26', 'DI 750', 'DI 42', 'DI 47', 'DI 55', 'DI 65', 'DI 90'] },
  ],
  industrial: [
    { make: 'Kirloskar', models: ['KG1-62.5AS', 'KG1-125AS', 'KG1-200AS', 'KG1-500AS', 'KG1-30AS', 'KG1-82.5AS', 'KG1-320AS', 'KG1-750AS', 'KG1-15AS', 'KG1-45AS'] },
    { make: 'Cummins', models: ['C200D5', 'C350D5', 'C500D5', 'C750D5', 'C150D5', 'C250D5', 'C400D5', 'C625D5', 'C100D5', 'C1000D5'] },
    { make: 'Ashok Leyland', models: ['LP25', 'LP45', 'LP62.5', 'LP100', 'LP125', 'LP200', 'LP250', 'LP320', 'LP400', 'LP500'] },
    { make: 'Ingersoll Rand', models: ['VR-843', 'VR-1056', 'P185', 'P250', 'SSR-UP6', 'HP375', 'P130', 'R90', 'R132', 'R160'] },
  ],
};

const SUB_CATEGORIES = {
  construction: ['Excavator', 'Backhoe Loader', 'Crane', 'Tower Crane', 'Wheel Loader', 'Bulldozer', 'Motor Grader', 'Compactor', 'Piling Rig', 'Concrete Mixer'],
  mining: ['Dumper', 'Rock Breaker', 'Drilling Rig', 'Surface Miner', 'Wheel Loader', 'Dozer', 'Screening Plant', 'Crusher'],
  agriculture: ['Tractor', 'Harvester', 'Rotavator', 'Seed Drill', 'Sprayer', 'Plough'],
  industrial: ['Generator', 'Compressor', 'Forklift', 'Welding Machine', 'Boom Lift', 'Scissor Lift'],
};

// Part data pools
const PART_CATEGORIES = ['engine', 'hydraulics', 'electrical', 'undercarriage', 'cab', 'attachments', 'other'];
const PART_CONDITIONS = ['new', 'used', 'oem', 'aftermarket', 'refurbished'];
const PART_NAMES = [
  'Engine Oil Filter', 'Air Filter Element', 'Fuel Filter', 'Hydraulic Seal Kit', 'Boom Cylinder', 'Bucket Teeth', 
  'Track Roller', 'Carrier Roller', 'Sprocket', 'Idler Assembly', 'Track Link Assembly', 'Track Shoe Pad',
  'Hydraulic Pump', 'Hydraulic Motor', 'Control Valve', 'Turbocharger', 'Alternator', 'Starter Motor',
  'Radiator Core', 'Water Pump', 'Fan Belt', 'Injector Nozzle', 'Head Gasket', 'Piston Ring Set',
  'Cabin Glass', 'Wiper Motor', 'Boom Light LED', 'Work Light', 'Ignition Switch', 'Instrument Cluster',
  'Swing Bearing', 'Slew Ring', 'Pin & Bush Kit', 'Bucket Link', 'Quick Coupler', 'Ripper Tooth',
  'Rock Bucket', 'Ditching Bucket', 'Grapple Attachment', 'Hammer Bracket Kit', 'Thumb Attachment', 'Tilt Rotator',
  'Joystick Controller', 'Pedal Valve', 'Solenoid Valve', 'Pressure Gauge', 'Accumulator', 'Hose Assembly',
  'Drive Motor', 'Final Drive', 'Planetary Gear Set', 'Travel Motor', 'Swing Motor', 'Hydraulic Breaker',
  'KMP Liner Kit', 'Crankshaft', 'Camshaft', 'Connecting Rod', 'Fuel Injection Pump', 'Exhaust Manifold',
];

const EQUIPMENT_TYPES_POOL = ['Excavator', 'Backhoe Loader', 'Crane', 'Tower Crane', 'Wheel Loader', 'Bulldozer', 'Motor Grader', 'Compactor', 'Forklift', 'Drilling Rig', 'Dumper', 'Tractor', 'Generator', 'Compressor', 'Boom Lift'];
const MECHANIC_SPECS = ['Engine', 'Hydraulics', 'Electrical', 'Welding', 'Tyres', 'PMS', 'Transmission', 'Air Conditioning', 'Painting', 'Undercarriage'];
const BRAND_POOL = ['JCB', 'Tata Hitachi', 'Komatsu', 'Volvo', 'Caterpillar', 'Hyundai', 'CASE', 'ACE', 'Liebherr', 'Sany', 'BEML', 'Mahindra', 'John Deere', 'TAFE', 'Kirloskar'];

const REVIEW_TITLES = [
  'Excellent machine in great condition', 'Very reliable operator', 'Good value for money', 'Highly recommend this seller',
  'Top quality spare parts', 'Prompt service delivery', 'Professional and skilled mechanic', 'Outstanding equipment condition',
  'Quick response and fair pricing', 'Smooth rental experience', 'Well maintained machinery', 'Genuine parts, fast shipping',
  'Experienced and reliable', 'Worth every rupee', 'Best in the region', 'Superb work quality', 'Very knowledgeable operator',
  'Timely delivery as promised', 'Great communication throughout', 'Exceeded our expectations',
];

const REVIEW_COMMENTS = [
  'The machine was in perfect working condition. Hydraulics smooth, engine powerful. Completed our project ahead of schedule.',
  'Very professional approach. Arrived on time, followed all safety protocols. Would hire again for sure.',
  'Quality parts at reasonable prices. Packaging was secure and delivery was prompt to our site.',
  'The operator handled the excavator with great skill. 15 years of experience really shows in the work quality.',
  'Mechanic diagnosed the hydraulic issue within minutes. Fixed it on-site and machine was back running in no time.',
  'Rented a crane for 2 months for our high-rise project. Zero downtime, excellent condition. Owner was very cooperative.',
  'Genuine OEM parts received. Perfect fit for our Komatsu PC210. Running smoothly after replacement.',
  'This dealer has a wide range of machines. Prices are competitive compared to other dealers in the region.',
  'The tractor was delivered to our farm on time. Engine runs smooth, tyres are in good condition. Happy with purchase.',
  'Skilled mechanic who specializes in Volvo excavators. Rare expertise. Traveled 80km to fix our machine on site.',
  'Generator rental was hassle-free. Machine was clean, well-serviced, and fuel efficient.',
  'The backhoe loader was perfect for our road construction project. Low hours, excellent maintenance history.',
  'Great after-sales support. The dealer helped us with financing options and documentation.',
  'Experienced operator who can handle multiple equipment types. Completed earthwork efficiently.',
  'The spare parts were genuine and came with warranty. Much better than local market alternatives.',
];

// ─── Helper Functions ────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPhone() { return (Math.random() > 0.5 ? '9' : '8') + String(randInt(100000000, 999999999)); }
function randDecimal(min, max, places = 1) { return Number((Math.random() * (max - min) + min).toFixed(places)); }
function futureDate(daysAhead) { return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000); }
function pastDate(daysAgo) { return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000); }
function dateOnly(d) { return d.toISOString().split('T')[0]; }

// ─── Seed Functions ──────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('\n👤 Seeding Users...');
  const roles = ['individual', 'contractor', 'company', 'dealer', 'operator', 'mechanic'];
  const users = [];

  // Create 10 users per role = 60 users
  for (const role of roles) {
    for (let i = 1; i <= 10; i++) {
      const email = `seed_${role}_${i}@yantrasetu.dev`;
      const loc = pick(INDIAN_CITIES);
      const [user] = await User.findOrCreate({
        where: { email },
        defaults: {
          phone: randPhone(),
          password: DEFAULT_PASSWORD,
          firstName: pick(FIRST_NAMES),
          lastName: pick(LAST_NAMES),
          email,
          userType: role,
          accountTier: pick(['free', 'starter', 'growth']),
          city: loc.city,
          state: loc.state,
          pincode: loc.pin,
          isVerified: true,
          isActive: true,
          rating: randDecimal(3.5, 5.0),
          reviewCount: randInt(5, 50),
        }
      });
      users.push(user);
    }
  }
  console.log(`  ✅ Seeded ${users.length} users`);
  return users;
}

async function seedMachinerySale(users) {
  console.log('\n🏗️  Seeding Machinery Listings (SALE)...');
  const owners = users.filter(u => ['contractor', 'company', 'dealer'].includes(u.userType));
  const categories = Object.keys(MAKES_MODELS);
  let count = 0;

  for (let i = 0; i < 55; i++) {
    const cat = categories[i % categories.length];
    const makeObj = pick(MAKES_MODELS[cat]);
    const model = pick(makeObj.models);
    const subCat = pick(SUB_CATEGORIES[cat]);
    const owner = owners[i % owners.length];
    const loc = pick(INDIAN_CITIES);
    const year = randInt(2016, 2025);
    const condition = pick(['new', 'used', 'refurbished']);
    const price = cat === 'agriculture' ? randInt(200000, 1200000) : 
                  cat === 'industrial' ? randInt(300000, 3000000) : 
                  cat === 'mining' ? randInt(2000000, 15000000) :
                  randInt(1500000, 8000000);

    try {
      await MachineryListing.create({
        userId: owner.id,
        listingType: 'sale',
        category: cat,
        subCategory: subCat,
        make: makeObj.make,
        model: `${model}-S${i + 1}`,
        year,
        hoursUsed: condition === 'new' ? 0 : randInt(500, 12000),
        condition,
        price,
        priceNegotiable: Math.random() > 0.3,
        description: `${makeObj.make} ${model} ${subCat} for sale. Year: ${year}. ${condition === 'new' ? 'Brand new, unused.' : `Well-maintained with ${randInt(500, 10000)} hours.`} All papers and certifications available. Immediate delivery possible. Located in ${loc.city}, ${loc.state}.`,
        city: loc.city,
        state: loc.state,
        pincode: loc.pin,
        status: pick(['approved', 'approved', 'approved', 'pending']),
        isVerified: Math.random() > 0.2,
        isFeatured: Math.random() > 0.8,
        isActive: true,
        images: [getImageForSubCategory(subCat, i)].filter(Boolean),
        viewCount: randInt(10, 500),
        contactUnlockCount: randInt(0, 30),
      });
      count++;
    } catch (e) {
      // skip duplicates
    }
  }
  console.log(`  ✅ Seeded ${count} sale listings`);
}

async function seedMachineryRent(users) {
  console.log('\n🔄 Seeding Machinery Listings (RENT)...');
  const owners = users.filter(u => ['contractor', 'company', 'dealer'].includes(u.userType));
  const categories = Object.keys(MAKES_MODELS);
  let count = 0;

  for (let i = 0; i < 55; i++) {
    const cat = categories[i % categories.length];
    const makeObj = pick(MAKES_MODELS[cat]);
    const model = pick(makeObj.models);
    const subCat = pick(SUB_CATEGORIES[cat]);
    const owner = owners[i % owners.length];
    const loc = pick(INDIAN_CITIES);
    const year = randInt(2018, 2025);
    const rentalUnit = pick(['hourly', 'daily', 'monthly']);
    const baseRate = rentalUnit === 'hourly' ? randInt(500, 5000) :
                     rentalUnit === 'daily' ? randInt(5000, 30000) :
                     randInt(45000, 200000);
    const withOp = Math.random() > 0.5;

    try {
      await MachineryListing.create({
        userId: owner.id,
        listingType: 'rent',
        category: cat,
        subCategory: subCat,
        make: makeObj.make,
        model: `${model}-R${i + 1}`,
        year,
        hoursUsed: randInt(500, 8000),
        condition: 'used',
        price: baseRate,
        priceNegotiable: true,
        rentalUnit,
        securityDeposit: randInt(50000, 500000),
        minimumRentalDuration: rentalUnit === 'monthly' ? randInt(1, 6) * 30 : rentalUnit === 'daily' ? randInt(3, 30) : randInt(8, 48),
        withOperator: withOp,
        operatorRate: withOp ? randInt(1000, 3000) : null,
        deliveryAvailable: Math.random() > 0.4,
        deliveryRadius: randInt(50, 200),
        description: `${makeObj.make} ${model} ${subCat} available for ${rentalUnit} rental. Year: ${year}. ${withOp ? 'Comes with experienced operator.' : 'Operator not included.'} Well-maintained and ready for deployment. Located in ${loc.city}.`,
        city: loc.city,
        state: loc.state,
        pincode: loc.pin,
        status: pick(['approved', 'approved', 'approved', 'pending']),
        isVerified: Math.random() > 0.2,
        isFeatured: Math.random() > 0.85,
        isActive: true,
        images: [getImageForSubCategory(subCat, i)].filter(Boolean),
        viewCount: randInt(10, 400),
        contactUnlockCount: randInt(0, 20),
      });
      count++;
    } catch (e) {
      // skip duplicates
    }
  }
  console.log(`  ✅ Seeded ${count} rent listings`);
}

async function seedParts(users) {
  console.log('\n⚙️  Seeding Spare Parts Listings...');
  const sellers = users.filter(u => ['dealer', 'company', 'contractor'].includes(u.userType));
  let count = 0;

  for (let i = 0; i < 55; i++) {
    const partName = PART_NAMES[i % PART_NAMES.length];
    const seller = sellers[i % sellers.length];
    const loc = pick(INDIAN_CITIES);
    const cat = pick(PART_CATEGORIES);
    const cond = pick(PART_CONDITIONS);
    const compatMake = pick(BRAND_POOL);

    try {
      await PartListing.create({
        userId: seller.id,
        partName: `${partName} (${compatMake})`,
        partNumber: `PT-${String(i + 1).padStart(4, '0')}`,
        oemPartNumber: `${compatMake.substring(0, 3).toUpperCase()}-${randInt(1000, 9999)}`,
        category: cat,
        condition: cond,
        price: cat === 'engine' ? randInt(2000, 80000) :
               cat === 'hydraulics' ? randInt(3000, 120000) :
               cat === 'undercarriage' ? randInt(5000, 150000) :
               cat === 'electrical' ? randInt(500, 15000) :
               cat === 'attachments' ? randInt(10000, 250000) :
               randInt(1000, 50000),
        quantity: randInt(1, 20),
        description: `${cond === 'new' ? 'Brand new' : cond === 'oem' ? 'Genuine OEM' : cond === 'refurbished' ? 'Professionally refurbished' : cond === 'aftermarket' ? 'High-quality aftermarket' : 'Good condition used'} ${partName} compatible with ${compatMake} machinery. Tested and quality assured. Ships within 2-3 business days.`,
        compatibleMakes: [compatMake, pick(BRAND_POOL)],
        compatibleModels: pickN(['PC210', 'JS205', 'EX200', 'EC210', '320D', 'R140', '770EX', '575 DI'], 3),
        compatibleYears: [randInt(2015, 2020), randInt(2020, 2025)],
        city: loc.city,
        state: loc.state,
        pincode: loc.pin,
        status: 'active',
        isActive: true,
        images: [getImageForPart(i)].filter(Boolean),
        viewCount: randInt(5, 300),
        contactUnlockCount: randInt(0, 15),
      });
      count++;
    } catch (e) {
      // skip 
    }
  }
  console.log(`  ✅ Seeded ${count} part listings`);
}

async function seedOperators(users) {
  console.log('\n👷 Seeding Operator Profiles...');
  // We need unique userId per operator profile, so create dedicated operator users
  const operatorUsers = [];
  for (let i = 1; i <= 55; i++) {
    const email = `seed_op_profile_${i}@yantrasetu.dev`;
    const loc = pick(INDIAN_CITIES);
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        phone: randPhone(),
        password: DEFAULT_PASSWORD,
        firstName: pick(FIRST_NAMES),
        lastName: pick(LAST_NAMES),
        email,
        userType: 'operator',
        city: loc.city,
        state: loc.state,
        pincode: loc.pin,
        isVerified: true,
        isActive: true,
        rating: randDecimal(3.5, 5.0),
        reviewCount: randInt(3, 40),
      }
    });
    operatorUsers.push(user);
  }

  let count = 0;
  for (let i = 0; i < 55; i++) {
    const user = operatorUsers[i];
    const loc = pick(INDIAN_CITIES);
    const exp = randInt(2, 25);
    const equipTypes = pickN(EQUIPMENT_TYPES_POOL, randInt(2, 5));

    try {
      await OperatorProfile.findOrCreate({
        where: { userId: user.id },
        defaults: {
          yearsOfExperience: exp,
          equipmentTypes: equipTypes,
          hasDGMSLicense: Math.random() > 0.6,
          hasCraneCertificate: equipTypes.includes('Crane') || equipTypes.includes('Tower Crane'),
          hasJCBExcavatorCertificate: equipTypes.includes('Excavator') || equipTypes.includes('Backhoe Loader'),
          hasDrivingLicense: true,
          isAvailable: Math.random() > 0.2,
          dayRate: randInt(800, 3000),
          projectRate: randInt(25000, 100000),
          city: loc.city,
          state: loc.state,
          pincode: loc.pin,
          willingToRelocate: Math.random() > 0.5,
          isVerified: Math.random() > 0.3,
          verificationStatus: pick(['approved', 'approved', 'pending']),
          isActive: true,
          rating: randDecimal(3.5, 5.0),
          reviewCount: randInt(2, 35),
          profileViews: randInt(20, 500),
          hireCount: randInt(5, 100),
          bio: `Experienced ${equipTypes[0]} operator with ${exp} years in the field. Skilled in ${equipTypes.join(', ')}. Safety-conscious professional with excellent track record. Available for projects across ${loc.state}.`,
        }
      });
      count++;
    } catch (e) {
      // skip
    }
  }
  console.log(`  ✅ Seeded ${count} operator profiles`);
  return operatorUsers;
}

async function seedMechanics(users) {
  console.log('\n🔧 Seeding Mechanic Profiles...');
  const mechanicUsers = [];
  for (let i = 1; i <= 55; i++) {
    const email = `seed_mech_profile_${i}@yantrasetu.dev`;
    const loc = pick(INDIAN_CITIES);
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        phone: randPhone(),
        password: DEFAULT_PASSWORD,
        firstName: pick(FIRST_NAMES),
        lastName: pick(LAST_NAMES),
        email,
        userType: 'mechanic',
        city: loc.city,
        state: loc.state,
        pincode: loc.pin,
        isVerified: true,
        isActive: true,
        rating: randDecimal(3.5, 5.0),
        reviewCount: randInt(3, 40),
      }
    });
    mechanicUsers.push(user);
  }

  let count = 0;
  for (let i = 0; i < 55; i++) {
    const user = mechanicUsers[i];
    const loc = pick(INDIAN_CITIES);
    const exp = randInt(3, 30);
    const specs = pickN(MECHANIC_SPECS, randInt(2, 5));
    const brands = pickN(BRAND_POOL, randInt(2, 6));

    try {
      await MechanicProfile.findOrCreate({
        where: { userId: user.id },
        defaults: {
          yearsOfExperience: exp,
          specializations: specs,
          brandExpertise: brands,
          hasITICertification: Math.random() > 0.4,
          hasDiploma: Math.random() > 0.5,
          isAvailable: Math.random() > 0.15,
          hourlyRate: randInt(300, 1200),
          dailyRate: randInt(2000, 8000),
          visitCharge: randInt(500, 3000),
          serviceRadius: randInt(20, 150),
          city: loc.city,
          state: loc.state,
          pincode: loc.pin,
          isVerified: Math.random() > 0.3,
          verificationStatus: pick(['approved', 'approved', 'pending']),
          isActive: true,
          rating: randDecimal(3.5, 5.0),
          reviewCount: randInt(2, 40),
          profileViews: randInt(20, 600),
          serviceCount: randInt(10, 200),
          bio: `${exp} years experienced mechanic specializing in ${specs.join(', ')}. Expert in ${brands.join(', ')} brands. ITI certified. Available for on-site repairs within ${randInt(20, 100)}km radius. Located in ${loc.city}, ${loc.state}.`,
        }
      });
      count++;
    } catch (e) {
      // skip
    }
  }
  console.log(`  ✅ Seeded ${count} mechanic profiles`);
  return mechanicUsers;
}

async function seedReviews(allUsers) {
  console.log('\n⭐ Seeding Reviews...');
  let count = 0;

  for (let i = 0; i < 55; i++) {
    const reviewer = allUsers[i % allUsers.length];
    // Pick a different user as reviewee
    let reviewee = allUsers[(i + 5) % allUsers.length];
    if (reviewer.id === reviewee.id) {
      reviewee = allUsers[(i + 10) % allUsers.length];
    }

    const reviewType = pick(['listing', 'user', 'operator', 'mechanic', 'rental']);
    const rating = randDecimal(3.0, 5.0);

    try {
      await Review.create({
        reviewerId: reviewer.id,
        revieweeId: reviewee.id,
        reviewType,
        rating,
        title: pick(REVIEW_TITLES),
        comment: pick(REVIEW_COMMENTS),
        punctualityRating: randDecimal(3.0, 5.0),
        qualityRating: randDecimal(3.0, 5.0),
        communicationRating: randDecimal(3.0, 5.0),
        valueRating: randDecimal(3.0, 5.0),
        isVerified: Math.random() > 0.4,
        isVisible: true,
        helpfulCount: randInt(0, 25),
      });
      count++;
    } catch (e) {
      // skip
    }
  }
  console.log(`  ✅ Seeded ${count} reviews`);
}

async function seedRentalBookings(users) {
  console.log('\n📋 Seeding Rental Bookings...');
  
  // Get existing rental listings
  const rentalListings = await MachineryListing.findAll({
    where: { listingType: 'rent', status: 'approved' },
    limit: 55,
  });

  if (rentalListings.length === 0) {
    console.log('  ⚠️  No approved rental listings found. Skipping bookings.');
    return;
  }

  const renters = users.filter(u => ['individual', 'contractor', 'company'].includes(u.userType));
  let count = 0;

  for (let i = 0; i < 55; i++) {
    const listing = rentalListings[i % rentalListings.length];
    const renter = renters[i % renters.length];
    
    // Don't let owner rent own listing
    if (renter.id === listing.userId) continue;

    const startDaysAgo = randInt(5, 90);
    const duration = randInt(7, 60);
    const startDate = pastDate(startDaysAgo);
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    const rentalRate = Number(listing.price) || randInt(5000, 50000);
    const totalRental = rentalRate * (listing.rentalUnit === 'monthly' ? Math.ceil(duration / 30) : listing.rentalUnit === 'daily' ? duration : duration * 8);
    const commission = totalRental * 0.1;
    const deposit = Number(listing.securityDeposit) || randInt(50000, 200000);
    const withOp = listing.withOperator || false;
    const opRate = withOp ? (Number(listing.operatorRate) || 1500) : 0;
    const opTotal = opRate * duration;
    const totalAmount = totalRental + commission + opTotal;
    const status = pick(['pending', 'confirmed', 'active', 'completed', 'completed', 'completed', 'cancelled']);

    try {
      await RentalBooking.create({
        listingId: listing.id,
        ownerId: listing.userId,
        renterId: renter.id,
        startDate: dateOnly(startDate),
        endDate: dateOnly(endDate),
        duration,
        rentalRate,
        rentalUnit: listing.rentalUnit || 'daily',
        totalRentalAmount: totalRental,
        securityDeposit: deposit,
        platformCommission: commission,
        commissionPercentage: 10.00,
        totalAmount,
        withOperator: withOp,
        operatorRate: withOp ? opRate : null,
        operatorTotal: withOp ? opTotal : null,
        status,
        paymentStatus: status === 'completed' ? 'completed' : status === 'cancelled' ? 'refunded' : pick(['pending', 'partial', 'completed']),
        amountPaid: status === 'completed' ? totalAmount : status === 'cancelled' ? 0 : randInt(0, totalAmount),
        depositStatus: status === 'completed' ? 'released' : status === 'cancelled' ? 'released' : pick(['pending', 'held']),
        payoutStatus: status === 'completed' ? 'completed' : 'pending',
        payoutAmount: status === 'completed' ? (totalRental - commission) : null,
        renterNotes: `Booking #${i + 1} — Need machinery for project in ${pick(INDIAN_CITIES).city}.`,
      });
      count++;
    } catch (e) {
      // skip
    }
  }
  console.log(`  ✅ Seeded ${count} rental bookings`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  try {
    const isFresh = process.argv.includes('--fresh');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    if (isFresh) {
      console.log('🔄 --fresh flag detected. Dropping all tables and recreating...');
      await sequelize.sync({ force: true });
      console.log('✅ Tables recreated (fresh)');
    } else {
      await sequelize.sync();
      console.log('✅ Tables synced');
    }

    console.log('\n🌱 Starting MASSIVE seed (50+ per category)...\n');
    console.log('═'.repeat(50));

    // 1. Users
    const users = await seedUsers();

    // 2. Machinery - Sale
    await seedMachinerySale(users);

    // 3. Machinery - Rent
    await seedMachineryRent(users);

    // 4. Spare Parts
    await seedParts(users);

    // 5. Operator Profiles  
    const opUsers = await seedOperators(users);

    // 6. Mechanic Profiles
    const mechUsers = await seedMechanics(users);

    // 7. Reviews (use all users combined)
    const allUsers = [...users, ...opUsers, ...mechUsers];
    await seedReviews(allUsers);

    // 8. Rental Bookings
    await seedRentalBookings(users);

    // ─── Summary ───────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(50));
    console.log('📊 SEED SUMMARY');
    console.log('═'.repeat(50));

    const counts = await Promise.all([
      User.count(),
      MachineryListing.count({ where: { listingType: 'sale' } }),
      MachineryListing.count({ where: { listingType: 'rent' } }),
      PartListing.count(),
      OperatorProfile.count(),
      MechanicProfile.count(),
      Review.count(),
      RentalBooking.count(),
    ]);

    const labels = ['Users', 'Machinery (Sale)', 'Machinery (Rent)', 'Spare Parts', 'Operator Profiles', 'Mechanic Profiles', 'Reviews', 'Rental Bookings'];
    labels.forEach((label, idx) => {
      const emoji = counts[idx] >= 50 ? '✅' : '⚠️';
      console.log(`  ${emoji} ${label}: ${counts[idx]}`);
    });

    console.log('\n🎉 Massive seed complete!');
    console.log('🔑 All seeded users use password: password123');
    console.log('📧 Example: seed_dealer_1@yantrasetu.dev / password123\n');

    await sequelize.close();
  } catch (err) {
    console.error('\n❌ SEED FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
