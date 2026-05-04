/**
 * Fleet Controller — API endpoints for Smart Fleet Optimizer
 */

const fleetService = require('../services/fleetOptimizerService');
const { RentalBooking, MachineryListing, User } = require('../models');
const { createNotification } = require('./notificationController');

// POST /api/fleet/optimize
// Find best single-owner fleet options for user's requirements
exports.optimizeFleet = async (req, res) => {
  try {
    const { machineTypes, days, city, state, segment, startDate, endDate } = req.body;

    if (!machineTypes || !Array.isArray(machineTypes) || machineTypes.length === 0) {
      return res.status(400).json({ message: 'machineTypes array is required (e.g. ["jcb", "dumper"])' });
    }

    const result = await fleetService.optimizeFleet({
      machineTypes,
      days: days || 7,
      city,
      state,
      segment: segment || 'individual',
      startDate,
      endDate,
    });

    res.json(result);
  } catch (err) {
    console.error('Fleet optimize error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/fleet/packages?city=Pune
// Get pre-defined bundle packages near a location
exports.getFleetPackages = async (req, res) => {
  try {
    const { city, state } = req.query;
    const packages = await fleetService.getFleetPackages(city, state);
    res.json({ packages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/fleet/owner/:ownerId
// Get all available machines from a specific owner
exports.getOwnerFleet = async (req, res) => {
  try {
    const machines = await fleetService.getOwnerFleet(req.params.ownerId);
    res.json({ machines });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/fleet/book-project
// Book multiple machines as a single project (atomic)
exports.bookProject = async (req, res) => {
  try {
    const { projectName, projectLocation, machines, startDate, endDate, segment } = req.body;

    if (!machines || !Array.isArray(machines) || machines.length === 0) {
      return res.status(400).json({ message: 'machines array is required' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end - start) / 86400000));
    const projectId = `PRJ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Verify all machines exist and belong to same owner
    const listings = await MachineryListing.findAll({
      where: { id: machines.map(m => m.listingId) },
    });

    if (listings.length !== machines.length) {
      return res.status(404).json({ message: 'Some machines not found' });
    }

    const ownerIds = [...new Set(listings.map(l => l.userId))];
    if (ownerIds.length > 1) {
      return res.status(400).json({
        message: 'All machines must belong to the same owner. Multi-owner booking creates conflicts.',
        ownerCount: ownerIds.length,
      });
    }

    const ownerId = ownerIds[0];
    if (ownerId === req.userId) {
      return res.status(400).json({ message: 'Cannot book your own machines' });
    }

    // Create all bookings atomically
    const bookings = [];
    for (const listing of listings) {
      const rate = parseFloat(listing.price);
      const total = rate * days;
      const deposit = total * 0.2;
      const commission = total * 0.1;

      // Bundle discount
      const bundleDiscount = listings.length >= 3 ? 0.10 : listings.length >= 2 ? 0.05 : 0;
      const discountAmount = Math.round(total * bundleDiscount);

      const booking = await RentalBooking.create({
        listingId: listing.id,
        ownerId: listing.userId,
        renterId: req.userId,
        startDate,
        endDate,
        duration: days,
        rentalRate: rate,
        rentalUnit: 'daily',
        totalRentalAmount: total - discountAmount,
        securityDeposit: deposit,
        platformCommission: commission,
        commissionPercentage: 10,
        totalAmount: total - discountAmount + deposit + commission,
        metadata: {
          projectId,
          projectName: projectName || 'Unnamed Project',
          projectLocation: projectLocation || '',
          bundleDiscount: discountAmount,
          bundleSize: listings.length,
          segment: segment || 'individual',
        },
      });

      bookings.push(booking);
    }

    // Notify the owner
    const renter = await User.findByPk(req.userId, { attributes: ['firstName', 'lastName'] });
    createNotification({
      userId: ownerId,
      type: 'project_booking',
      title: `🏗️ New Fleet Booking — ${listings.length} Machines!`,
      body: `${renter?.firstName || 'Someone'} wants to rent ${listings.length} machines for ${days} days. Project: ${projectName || 'Unnamed'}`,
      data: { projectId, bookingIds: bookings.map(b => b.id) },
    });

    res.status(201).json({
      message: `Project booked! ${bookings.length} machines reserved.`,
      projectId,
      bookings,
      totalCost: bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0),
    });
  } catch (err) {
    console.error('Project booking error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/fleet/segments
// Return available user segments and their descriptions
exports.getSegments = (req, res) => {
  res.json({ segments: fleetService.SEGMENTS, machineTypes: Object.keys(fleetService.MACHINE_TYPE_MAP) });
};
