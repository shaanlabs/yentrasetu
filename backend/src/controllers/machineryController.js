const { Op } = require('sequelize');
const { MachineryListing, User, Review } = require('../models');
const { sequelize } = require('../config/database');
const { parsePagination } = require('../config/pagination');

// Create new machinery listing
const createListing = async (req, res) => {
  try {
    // Enforce listing limits based on subscription/accountTier
    const user = await User.findByPk(req.userId);
    const listingCount = await MachineryListing.count({ where: { userId: req.userId } });
    
    let maxListings = 5; // Default for free
    if (user.accountTier === 'starter') maxListings = 20;
    if (user.accountTier === 'growth') maxListings = 100;
    if (user.accountTier === 'enterprise') maxListings = -1; // unlimited

    if (maxListings !== -1 && listingCount >= maxListings) {
      return res.status(403).json({ 
        success: false, 
        message: `Plan limit reached. Your current plan (${user.accountTier}) allows only ${maxListings} listings. Please upgrade your subscription to post more.` 
      });
    }

    const allowedFields = [
      'listingType', 'category', 'subCategory', 'make', 'model', 'year',
      'condition', 'hoursUsed', 'description', 'price', 'rentalRateDaily',
      'rentalRateWeekly', 'rentalRateMonthly', 'city', 'state', 'pincode',
      'latitude', 'longitude', 'images', 'documentImages', 'specifications', 'features',
      'availableFrom', 'availableTo', 'operatorAvailable', 'deliveryAvailable',
      'insuranceValid', 'registrationNumber'
    ];
    const listingData = { userId: req.userId, status: 'pending' };
    allowedFields.forEach(f => { if (req.body[f] !== undefined) listingData[f] = req.body[f]; });

    // Set expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    listingData.expiresAt = expiresAt;

    const listing = await MachineryListing.create(listingData);

    res.status(201).json({
      message: 'Listing created successfully. Pending verification.',
      listing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ message: 'Failed to create listing.', error: error.message });
  }
};

// Get all listings with filters
const getListings = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      make,
      model,
      listingType,
      condition,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      city,
      state,
      query,
      isVerified,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      lat,
      lng,
      radius = 50 // km
    } = req.query;

    const where = {
      status: 'approved',
      isActive: true,
    };

    // Exclude expired listings
    where[Op.and] = [
      { [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }] }
    ];

    // Apply filters
    if (category) where.category = category;
    if (subCategory) where.subCategory = subCategory;
    if (make) where.make = { [Op.like]: `%${make}%` };
    if (model) where.model = { [Op.like]: `%${model}%` };
    if (listingType) where.listingType = listingType;
    if (condition) where.condition = condition;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    if (minYear || maxYear) {
      where.year = {};
      if (minYear) where.year[Op.gte] = minYear;
      if (maxYear) where.year[Op.lte] = maxYear;
    }

    if (city) where.city = { [Op.like]: `%${city}%` };
    if (state) where.state = { [Op.like]: `%${state}%` };

    // Smart full-text search: handles "JCB 3DX", "Tata Excavator Pune", etc.
    if (query) {
      const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
      const trimmed = query.trim();
      const words = trimmed.split(/\s+/).filter(w => w.length > 1);

      if (words.length > 1) {
        // Multi-word query: each word must match at least one field
        // "JCB 3DX" → word "JCB" matches make, word "3DX" matches model → FOUND
        // "Tata Excavator Pune" → "Tata" in make, "Excavator" in subCategory, "Pune" in city → FOUND
        const wordConditions = words.map(word => ({
          [Op.or]: [
            { make: { [likeOp]: `%${word}%` } },
            { model: { [likeOp]: `%${word}%` } },
            { subCategory: { [likeOp]: `%${word}%` } },
            { description: { [likeOp]: `%${word}%` } },
            { city: { [likeOp]: `%${word}%` } },
            { state: { [likeOp]: `%${word}%` } },
          ]
        }));
        // Also try the full query as a single phrase in concatenated make+model
        if (!where[Op.and]) where[Op.and] = [];
        where[Op.and].push({
          [Op.or]: [
            // All words must match (AND logic across words)
            { [Op.and]: wordConditions },
            // OR full phrase matches concatenated make + model
            sequelize.where(
              sequelize.fn('LOWER',
                sequelize.fn('CONCAT', sequelize.col('make'), ' ', sequelize.col('model'))
              ),
              { [likeOp]: `%${trimmed.toLowerCase()}%` }
            ),
            // OR full phrase in description
            { description: { [likeOp]: `%${trimmed}%` } },
          ]
        });
      } else {
        // Single-word query: search all fields
        where[Op.or] = [
          { make: { [likeOp]: `%${trimmed}%` } },
          { model: { [likeOp]: `%${trimmed}%` } },
          { subCategory: { [likeOp]: `%${trimmed}%` } },
          { category: { [likeOp]: `%${trimmed}%` } },
          { description: { [likeOp]: `%${trimmed}%` } },
          { city: { [likeOp]: `%${trimmed}%` } },
          { state: { [likeOp]: `%${trimmed}%` } },
        ];
      }
    }

    // Location-based search with correct lat/lng bounding box
    if (lat && lng) {
      const latFloat = parseFloat(lat);
      const lngFloat = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      const latDegrees = radiusKm / 111; // 1° latitude ≈ 111 km
      // Correct longitude conversion: depends on latitude
      const lngDegrees = radiusKm / (111 * Math.cos(latFloat * Math.PI / 180));
      
      where.latitude = {
        [Op.between]: [latFloat - latDegrees, latFloat + latDegrees]
      };
      where.longitude = {
        [Op.between]: [lngFloat - lngDegrees, lngFloat + lngDegrees]
      };
    }

    // Sorting
    const order = [];
    if (sortBy === 'price') {
      order.push(['price', sortOrder]);
    } else if (sortBy === 'year') {
      order.push(['year', sortOrder]);
    } else if (sortBy === 'nearest' && lat && lng) {
      // Haversine distance sort via raw SQL
      const latFloat = parseFloat(lat);
      const lngFloat = parseFloat(lng);
      const dialect = sequelize.getDialect();
      if (dialect === 'postgres') {
        order.push([
          sequelize.literal(
            `(6371 * acos(cos(radians(${latFloat})) * cos(radians("latitude")) * cos(radians("longitude") - radians(${lngFloat})) + sin(radians(${latFloat})) * sin(radians("latitude"))))`
          ),
          'ASC'
        ]);
      } else {
        // SQLite fallback: approximate Euclidean distance
        order.push([
          sequelize.literal(
            `((${latFloat} - CAST("latitude" AS REAL)) * (${latFloat} - CAST("latitude" AS REAL)) + (${lngFloat} - CAST("longitude" AS REAL)) * (${lngFloat} - CAST("longitude" AS REAL)))`
          ),
          'ASC'
        ]);
      }
    } else {
      order.push([sortBy, sortOrder]);
    }

    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows: listings } = await MachineryListing.findAndCountAll({
      where,
      // Note: images included for card thumbnails on the frontend
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'companyName', 'rating', 'userType']
        }
      ],
      order,
      limit,
      offset
    });

    res.json({
      listings,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ message: 'Failed to get listings.', error: error.message });
  }
};


// Get single listing
const getListing = async (req, res) => {
  try {
    const { id } = req.params;

    // Also check soft-deleted listings with paranoid:false
    const listing = await MachineryListing.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'companyName', 'rating', 'userType', 'city', 'state', 'createdAt']
        }
      ],
      paranoid: false, // Include soft-deleted to show proper message
    });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.', code: 'NOT_FOUND' });
    }

    // Check if soft-deleted
    if (listing.deletedAt) {
      return res.status(410).json({
        message: 'This listing has been removed by the seller.',
        code: 'DELETED',
        category: listing.category,
        make: listing.make,
      });
    }

    // Check if expired
    if (listing.expiresAt && new Date(listing.expiresAt) < new Date()) {
      return res.status(410).json({
        message: 'This listing has expired.',
        code: 'EXPIRED',
        category: listing.category,
        make: listing.make,
      });
    }

    // Check if rejected
    if (listing.status === 'rejected') {
      return res.status(410).json({
        message: 'This listing is no longer available.',
        code: 'REJECTED',
        category: listing.category,
        make: listing.make,
      });
    }

    // Increment view count
    await listing.increment('viewCount');

    // Get owner's other listings
    const otherListings = await MachineryListing.findAll({
      where: {
        userId: listing.userId,
        id: { [Op.ne]: id },
        status: 'approved',
        isActive: true
      },
      limit: 4,
      attributes: ['id', 'make', 'model', 'price', 'year', 'images', 'listingType']
    });

    res.json({
      listing,
      otherListingsFromSeller: otherListings
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ message: 'Failed to get listing.', error: error.message });
  }
};

// Update listing
// Fields that require re-moderation when changed
const MODERATION_FIELDS = ['description', 'images', 'price', 'make', 'model', 'category'];

const updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await MachineryListing.findOne({
      where: { id, userId: req.userId }
    });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or not authorized.' });
    }

    // Allowlist: only these fields can be updated by the owner
    const allowedFields = [
      'listingType', 'category', 'subCategory', 'make', 'model', 'year',
      'condition', 'hoursUsed', 'description', 'price', 'rentalRateDaily',
      'rentalRateWeekly', 'rentalRateMonthly', 'withOperator', 'minimumRentalDays',
      'securityDeposit', 'city', 'state', 'pincode', 'address', 'latitude',
      'longitude', 'images', 'rcDocument', 'insuranceDocument', 'inspectionReport',
    ];

    const updates = {};
    let needsRemoderation = false;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
        // Check if a moderation-sensitive field changed
        if (MODERATION_FIELDS.includes(field)) {
          const oldVal = JSON.stringify(listing[field]);
          const newVal = JSON.stringify(req.body[field]);
          if (oldVal !== newVal) needsRemoderation = true;
        }
      }
    }

    // Re-trigger moderation if key fields changed
    if (needsRemoderation && listing.status === 'approved') {
      updates.status = 'pending';
    }

    await listing.update(updates);

    const message = needsRemoderation && listing.status === 'approved'
      ? 'Listing updated. Key fields changed — listing sent back for review.'
      : 'Listing updated successfully.';

    res.json({ message, listing, remoderated: needsRemoderation });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ message: 'Failed to update listing.', error: error.message });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await MachineryListing.findOne({
      where: { id, userId: req.userId }
    });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or not authorized.' });
    }

    await listing.destroy();

    res.json({ message: 'Listing deleted successfully.' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Failed to delete listing.', error: error.message });
  }
};

// Get user's listings
const getMyListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const where = { userId: req.userId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: listings } = await MachineryListing.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      listings,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ message: 'Failed to get listings.', error: error.message });
  }
};

// Mark listing as sold/rented
const markAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'sold' or 'rented'

    const listing = await MachineryListing.findOne({
      where: { id, userId: req.userId }
    });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or not authorized.' });
    }

    await listing.update({ status });

    res.json({
      message: `Listing marked as ${status} successfully.`,
      listing
    });
  } catch (error) {
    console.error('Mark as sold error:', error);
    res.status(500).json({ message: 'Failed to update listing.', error: error.message });
  }
};

// Renew listing
const renewListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await MachineryListing.findOne({
      where: { id, userId: req.userId }
    });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or not authorized.' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await listing.update({
      status: 'pending', // Go through verification again
      expiresAt
    });

    res.json({
      message: 'Listing renewed successfully. Pending verification.',
      listing
    });
  } catch (error) {
    console.error('Renew listing error:', error);
    res.status(500).json({ message: 'Failed to renew listing.', error: error.message });
  }
};

// ─── Comprehensive Indian Equipment Database ───────────────
// Source: ICEMA data, manufacturer specs, FY26 trailing
const EQUIPMENT_DATABASE = {
  construction: {
    label: 'Construction',
    subCategories: {
      'Excavators': {
        makes: ['JCB', 'Tata Hitachi', 'Komatsu', 'Hyundai', 'Volvo', 'SANY', 'CASE', 'Kobelco', 'Doosan', 'Liugong'],
        priceRange: { min: 4500000, max: 70000000 },
        rentalRange: { daily: 8000, monthly: 180000 },
        specs: ['Operating Weight (tons)', 'Bucket Capacity (m³)', 'Engine Power (HP)', 'Digging Depth (m)'],
      },
      'Backhoe Loaders': {
        makes: ['JCB', 'CASE', 'Mahindra', 'Caterpillar', 'Tata Hitachi', 'ACE'],
        priceRange: { min: 2800000, max: 4200000 },
        rentalRange: { daily: 5000, monthly: 100000 },
        specs: ['Engine Power (HP)', 'Bucket Capacity (m³)', 'Digging Depth (m)', 'Loading Height (m)'],
      },
      'Bulldozers': {
        makes: ['Caterpillar', 'Komatsu', 'BEML', 'Shantui', 'Liugong'],
        priceRange: { min: 5000000, max: 25000000 },
        rentalRange: { daily: 12000, monthly: 280000 },
        specs: ['Engine Power (HP)', 'Blade Width (m)', 'Operating Weight (tons)'],
      },
      'Motor Graders': {
        makes: ['Caterpillar', 'Volvo', 'BEML', 'SANY', 'SDLG'],
        priceRange: { min: 7500000, max: 12000000 },
        rentalRange: { daily: 15000, monthly: 350000 },
        specs: ['Blade Width (m)', 'Engine Power (HP)', 'Operating Weight (tons)'],
      },
      'Wheel Loaders': {
        makes: ['Caterpillar', 'SDLG', 'Komatsu', 'JCB', 'Volvo', 'Liugong', 'SANY'],
        priceRange: { min: 4500000, max: 8000000 },
        rentalRange: { daily: 8000, monthly: 180000 },
        specs: ['Bucket Capacity (m³)', 'Engine Power (HP)', 'Operating Weight (tons)'],
      },
      'Soil Compactors': {
        makes: ['BOMAG', 'Dynapac', 'Volvo', 'CASE', 'Caterpillar', 'Hamm'],
        priceRange: { min: 2800000, max: 4500000 },
        rentalRange: { daily: 5000, monthly: 100000 },
        specs: ['Drum Width (mm)', 'Operating Weight (tons)', 'Centrifugal Force (kN)'],
      },
      'Tower Cranes': {
        makes: ['Liebherr', 'Potain', 'ACE', 'Comansa', 'Zoomlion'],
        priceRange: { min: 15000000, max: 40000000 },
        rentalRange: { daily: 25000, monthly: 600000 },
        specs: ['Max Lifting Capacity (tons)', 'Jib Length (m)', 'Max Height (m)'],
      },
      'Mobile Cranes': {
        makes: ['ACE', 'Escorts', 'Action Construction', 'Zoomlion', 'SANY', 'Liebherr', 'Tadano'],
        priceRange: { min: 8000000, max: 50000000 },
        rentalRange: { daily: 20000, monthly: 450000 },
        specs: ['Max Lifting Capacity (tons)', 'Boom Length (m)', 'Engine Power (HP)'],
      },
      'Concrete Pumps': {
        makes: ['Schwing Stetter', 'Putzmeister', 'SANY', 'Everest'],
        priceRange: { min: 3000000, max: 15000000 },
        rentalRange: { daily: 10000, monthly: 250000 },
        specs: ['Max Output (m³/hr)', 'Max Pressure (bar)', 'Boom Length (m)'],
      },
    }
  },
  concrete: {
    label: 'Concrete',
    subCategories: {
      'Batching Plants': {
        makes: ['Schwing Stetter', 'Ajax Fiori', 'Apollo', 'MEKA', 'Macons'],
        priceRange: { min: 8000000, max: 30000000 },
        rentalRange: { daily: 20000, monthly: 500000 },
        specs: ['Output Capacity (m³/hr)', 'Aggregate Bins', 'Mixer Type'],
      },
      'Transit Mixers': {
        makes: ['Schwing Stetter', 'Ajax Fiori', 'Greaves', 'Aquarius', 'KYB-Conmat'],
        priceRange: { min: 2800000, max: 4000000 },
        rentalRange: { daily: 6000, monthly: 130000 },
        specs: ['Drum Capacity (m³)', 'Chassis Make', 'GVW (tons)'],
      },
      'Concrete Boom Pumps': {
        makes: ['Schwing Stetter', 'Putzmeister', 'SANY', 'Everest', 'Zoomlion'],
        priceRange: { min: 12000000, max: 25000000 },
        rentalRange: { daily: 30000, monthly: 700000 },
        specs: ['Boom Length (m)', 'Max Output (m³/hr)', 'Max Pressure (bar)'],
      },
    }
  },
  foundation: {
    label: 'Foundation',
    subCategories: {
      'Piling Rigs': {
        makes: ['Bauer', 'Soilmec', 'Casagrande', 'IMT', 'SANY', 'Mait'],
        priceRange: { min: 30000000, max: 80000000 },
        rentalRange: { daily: 50000, monthly: 1200000 },
        specs: ['Max Drilling Depth (m)', 'Max Diameter (mm)', 'Torque (kNm)'],
      },
      'Sheet Pile Drivers': {
        makes: ['Junttan', 'ICE', 'BSP', 'Dawson'],
        priceRange: { min: 15000000, max: 40000000 },
        rentalRange: { daily: 35000, monthly: 800000 },
        specs: ['Impact Energy (kJ)', 'Blow Rate (blows/min)', 'Weight (tons)'],
      },
    }
  },
  mining: {
    label: 'Mining',
    subCategories: {
      'Dumpers': {
        makes: ['Tata', 'Ashok Leyland', 'BharatBenz', 'Volvo', 'BEML', 'Caterpillar'],
        priceRange: { min: 3500000, max: 50000000 },
        rentalRange: { daily: 8000, monthly: 180000 },
        specs: ['Payload (tons)', 'Engine Power (HP)', 'GVW (tons)'],
      },
      'Drills': {
        makes: ['Atlas Copco', 'Sandvik', 'Caterpillar', 'Furukawa'],
        priceRange: { min: 10000000, max: 30000000 },
        rentalRange: { daily: 20000, monthly: 450000 },
        specs: ['Hole Diameter (mm)', 'Drill Depth (m)', 'Air Pressure (bar)'],
      },
      'Loaders': {
        makes: ['Caterpillar', 'SDLG', 'Komatsu', 'Volvo', 'JCB', 'BEML'],
        priceRange: { min: 4500000, max: 15000000 },
        rentalRange: { daily: 10000, monthly: 220000 },
        specs: ['Bucket Capacity (m³)', 'Engine Power (HP)', 'Operating Weight (tons)'],
      },
      'Conveyor Systems': {
        makes: ['Metso', 'Sandvik', 'ThyssenKrupp', 'L&T'],
        priceRange: { min: 5000000, max: 20000000 },
        specs: ['Belt Width (mm)', 'Conveyor Length (m)', 'Capacity (tons/hr)'],
      },
      'Rock Breakers': {
        makes: ['Atlas Copco', 'Sandvik', 'Furukawa', 'Soosan', 'Indeco'],
        priceRange: { min: 1500000, max: 8000000 },
        rentalRange: { daily: 6000, monthly: 130000 },
        specs: ['Impact Energy (J)', 'Operating Weight (kg)', 'Tool Diameter (mm)'],
      },
    }
  },
  agriculture: {
    label: 'Agriculture',
    subCategories: {
      'Tractors': {
        makes: ['Mahindra', 'Swaraj', 'John Deere', 'Sonalika', 'TAFE', 'Escorts', 'Kubota', 'New Holland'],
        priceRange: { min: 500000, max: 3500000 },
        rentalRange: { daily: 2500, monthly: 50000 },
        specs: ['Engine Power (HP)', 'Number of Cylinders', 'PTO HP', 'Lift Capacity (kg)'],
      },
      'Harvesters': {
        makes: ['John Deere', 'Claas', 'Kartar', 'Preet', 'Dasmesh'],
        priceRange: { min: 1500000, max: 5000000 },
        rentalRange: { daily: 8000, monthly: 180000 },
        specs: ['Cutting Width (ft)', 'Engine Power (HP)', 'Grain Tank (L)'],
      },
      'Rotavators': {
        makes: ['Shaktiman', 'Mahindra', 'Maschio Gaspardo', 'Fieldking'],
        priceRange: { min: 80000, max: 300000 },
        specs: ['Working Width (mm)', 'Number of Blades', 'Depth (mm)'],
      },
      'Sprayers': {
        makes: ['Aspee', 'Stihl', 'Honda', 'Kisankraft'],
        priceRange: { min: 5000, max: 200000 },
        specs: ['Tank Capacity (L)', 'Spray Range (m)', 'Pump Type'],
      },
      'Threshers': {
        makes: ['Rajkumar', 'Tulsi', 'Amar', 'Kisan'],
        priceRange: { min: 100000, max: 500000 },
        specs: ['Output (quintals/hr)', 'Engine Power (HP)', 'Feed Type'],
      },
    }
  },
  industrial: {
    label: 'Industrial',
    subCategories: {
      'Forklifts': {
        makes: ['Toyota', 'Kion', 'Godrej', 'Voltas', 'ACE', 'Crown'],
        priceRange: { min: 800000, max: 5000000 },
        rentalRange: { daily: 3000, monthly: 65000 },
        specs: ['Lift Capacity (tons)', 'Max Lift Height (m)', 'Fork Length (mm)', 'Power Source'],
      },
      'Compressors': {
        makes: ['Atlas Copco', 'Ingersoll Rand', 'Elgi', 'Kaeser', 'Chicago Pneumatic'],
        priceRange: { min: 300000, max: 5000000 },
        rentalRange: { daily: 3000, monthly: 60000 },
        specs: ['Pressure (bar)', 'Free Air Delivery (CFM)', 'Power (kW)'],
      },
      'Generators': {
        makes: ['Cummins', 'Kirloskar', 'Caterpillar', 'Ashok Leyland', 'Mahindra', 'Jakson'],
        priceRange: { min: 200000, max: 10000000 },
        rentalRange: { daily: 3000, monthly: 60000 },
        specs: ['Power Output (kVA)', 'Fuel Type', 'Phase', 'Engine Make'],
      },
      'CNC Machines': {
        makes: ['DMG Mori', 'Mazak', 'BFW', 'HMT', 'Ace Designers', 'Haas'],
        priceRange: { min: 1500000, max: 30000000 },
        specs: ['Spindle Speed (RPM)', 'Number of Axes', 'Table Size (mm)', 'Control System'],
      },
      'Welding Equipment': {
        makes: ['ESAB', 'Lincoln Electric', 'Miller', 'Ador', 'Fronius'],
        priceRange: { min: 20000, max: 1500000 },
        rentalRange: { daily: 1000, monthly: 20000 },
        specs: ['Welding Current (A)', 'Duty Cycle (%)', 'Welding Process', 'Input Voltage'],
      },
    }
  },
};

// Get categories, makes, and equipment database
const getCategories = async (req, res) => {
  try {
    // Build legacy categories format for backward compatibility
    const categories = {};
    for (const [catKey, catData] of Object.entries(EQUIPMENT_DATABASE)) {
      categories[catKey] = Object.keys(catData.subCategories);
    }

    // Get unique makes from existing listings
    const makes = await MachineryListing.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('make')), 'make']],
      where: { status: 'approved' },
      order: [['make', 'ASC']]
    });

    // Collect all known makes from equipment database
    const allKnownMakes = new Set();
    for (const catData of Object.values(EQUIPMENT_DATABASE)) {
      for (const subCat of Object.values(catData.subCategories)) {
        subCat.makes.forEach(m => allKnownMakes.add(m));
      }
    }

    res.json({
      categories,
      makes: makes.map(m => m.make),
      equipmentDatabase: EQUIPMENT_DATABASE,
      allMakes: [...allKnownMakes].sort(),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories.', error: error.message });
  }
};

// Search suggestions for autocomplete
const searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: {} });

    const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    const searchTerm = `%${q.trim()}%`;

    const [matchingMakes, matchingModels, matchingCities] = await Promise.all([
      MachineryListing.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('make')), 'make']],
        where: { status: 'approved', make: { [likeOp]: searchTerm } },
        limit: 5, order: [['make', 'ASC']]
      }),
      MachineryListing.findAll({
        attributes: ['model', 'make'],
        where: { status: 'approved', model: { [likeOp]: searchTerm } },
        group: ['model', 'make'],
        limit: 5
      }),
      MachineryListing.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('city')), 'city']],
        where: { status: 'approved', city: { [likeOp]: searchTerm } },
        limit: 5, order: [['city', 'ASC']]
      }),
    ]);

    // Match equipment types from database
    const matchingEquipment = [];
    const matchingDbMakes = new Set();
    const qLower = q.toLowerCase();
    for (const [catKey, catData] of Object.entries(EQUIPMENT_DATABASE)) {
      for (const [subCatName, subCatData] of Object.entries(catData.subCategories)) {
        if (subCatName.toLowerCase().includes(qLower)) {
          matchingEquipment.push({ name: subCatName, category: catKey });
        }
        subCatData.makes.forEach(m => {
          if (m.toLowerCase().includes(qLower)) matchingDbMakes.add(m);
        });
      }
    }

    res.json({
      suggestions: {
        makes: [...new Set([...matchingMakes.map(m => m.make), ...matchingDbMakes])].slice(0, 8),
        models: matchingModels.map(m => ({ model: m.model, make: m.make })),
        equipment: matchingEquipment.slice(0, 5),
        cities: matchingCities.map(c => c.city),
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions.', error: error.message });
  }
};

// Submit an enquiry for a sale listing (Lead generation)
const submitEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, city, notes } = req.body;

    const listing = await MachineryListing.findByPk(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // In a full implementation, you would save this to a `Lead` table or send an email/SMS.
    console.log(`[LEAD] New Enquiry for Listing ${id} (${listing.make} ${listing.model}): Name: ${name}, Phone: ${phone}, City: ${city}`);

    res.json({ message: 'Enquiry submitted successfully. The seller will contact you shortly.' });
  } catch (error) {
    console.error('Submit enquiry error:', error);
    res.status(500).json({ message: 'Failed to submit enquiry.', error: error.message });
  }
};

module.exports = {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  getMyListings,
  markAsSold,
  renewListing,
  getCategories,
  searchSuggestions,
  submitEnquiry,
  EQUIPMENT_DATABASE
};

