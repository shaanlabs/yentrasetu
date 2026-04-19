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
      'latitude', 'longitude', 'images', 'specifications', 'features',
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

    // Full-text search across make, model, description, city
    if (query) {
      where[Op.or] = [
        { make: { [Op.like]: `%${query}%` } },
        { model: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { city: { [Op.like]: `%${query}%` } },
        { subCategory: { [Op.like]: `%${query}%` } },
      ];
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

    const listing = await MachineryListing.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'companyName', 'rating', 'userType', 'city', 'state', 'createdAt']
        }
      ]
    });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
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
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await listing.update(updates);

    res.json({
      message: 'Listing updated successfully.',
      listing
    });
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

// Get categories and makes
const getCategories = async (req, res) => {
  try {
    const categories = {
      construction: ['Excavators', 'Cranes', 'Bulldozers', 'Graders', 'Compactors', 'Tower Cranes', 'Concrete Pumps'],
      mining: ['Dumpers', 'Drills', 'Loaders', 'Conveyor Systems', 'Rock Breakers'],
      agriculture: ['Tractors', 'Harvesters', 'Rotavators', 'Sprayers', 'Threshers'],
      industrial: ['Forklifts', 'Compressors', 'Generators', 'CNC Machines', 'Welding Equipment']
    };

    const makes = await MachineryListing.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('make')), 'make']],
      where: { status: 'approved' },
      order: [['make', 'ASC']]
    });

    res.json({
      categories,
      makes: makes.map(m => m.make)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories.', error: error.message });
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
  getCategories
};
