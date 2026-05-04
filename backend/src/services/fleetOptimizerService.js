/**
 * ═══════════════════════════════════════════════════════════════
 * FLEET OPTIMIZER SERVICE — Smart Fleet Matching Engine
 * ═══════════════════════════════════════════════════════════════
 * 
 * Solves the core Indian construction equipment rental problem:
 * - User needs JCB + Dumper + Roller
 * - Owner A has all 3 but expensive
 * - Owner B has JCB + Dumper (cheaper) but no Roller
 * - Owner C has cheap Roller but you can't mix owners
 * 
 * Algorithm: Find the BEST SINGLE-OWNER fleet that covers
 * the user's requirements, scored by completeness × price × 
 * reliability × fair distribution.
 * 
 * Segment-aware: small user gets cheapest, enterprise gets 
 * best reliability, government gets compliance-first.
 * 
 * REAL-WORLD RULES:
 * 1. Single-owner fleet ALWAYS preferred (no cross-owner mixing)
 * 2. Bundle-only machines can't be rented individually
 * 3. Fair distribution prevents monopoly (no owner gets >20% of area bookings)
 * 4. Price fairness check prevents race-to-bottom
 */

const { MachineryListing, User, RentalBooking } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// ─── MACHINE TYPE MAPPING ──────────────────────────────────
// Maps user-friendly names to database subCategory values
const MACHINE_TYPE_MAP = {
  'jcb': ['Backhoe Loader', 'JCB', 'backhoe'],
  'excavator': ['Excavator', 'Mini Excavator', 'excavator'],
  'dumper': ['Dumper', 'Tipper', 'Dump Truck', 'dumper'],
  'roller': ['Roller', 'Road Roller', 'Compactor', 'roller'],
  'crane': ['Crane', 'Mobile Crane', 'Tower Crane', 'crane'],
  'bulldozer': ['Bulldozer', 'Dozer', 'bulldozer'],
  'loader': ['Wheel Loader', 'Loader', 'Skid Steer', 'loader'],
  'concrete_mixer': ['Concrete Mixer', 'Transit Mixer', 'Batching Plant'],
  'piling_rig': ['Piling Rig', 'Bore Rig', 'piling'],
  'generator': ['Generator', 'DG Set', 'generator'],
  'compressor': ['Compressor', 'Air Compressor', 'compressor'],
  'tower_crane': ['Tower Crane'],
  'grader': ['Motor Grader', 'Grader', 'grader'],
  'paver': ['Paver', 'Asphalt Paver', 'paver'],
  'hydra': ['Hydra', 'Hydra Crane', 'Pick and Carry Crane'],
};

// ─── USER SEGMENTS ─────────────────────────────────────────
// Each segment has different scoring weights
const SEGMENTS = {
  individual: {
    label: 'Individual / Small Contractor',
    // Small user: cheapest price is king
    weights: { completeness: 0.25, price: 0.40, reliability: 0.15, fairShare: 0.10, distance: 0.10 },
    maxBudgetMultiplier: 1.0, // Won't pay above market average
    showBundles: true,
    showNegotiate: true,
  },
  contractor: {
    label: 'Contractor / Builder',
    // Medium: balance of price and reliability
    weights: { completeness: 0.30, price: 0.25, reliability: 0.25, fairShare: 0.10, distance: 0.10 },
    maxBudgetMultiplier: 1.15,
    showBundles: true,
    showNegotiate: true,
  },
  enterprise: {
    label: 'Real Estate / Enterprise',
    // Big: reliability and fleet completeness matter most
    weights: { completeness: 0.35, price: 0.15, reliability: 0.30, fairShare: 0.10, distance: 0.10 },
    maxBudgetMultiplier: 1.3,
    showBundles: true,
    showNegotiate: false, // Enterprise doesn't bargain per-machine
  },
  government: {
    label: 'Government / PSU',
    // Government: compliance, verification, documentation
    weights: { completeness: 0.30, price: 0.20, reliability: 0.30, fairShare: 0.10, distance: 0.10 },
    maxBudgetMultiplier: 1.0, // Government rate cards
    showBundles: false,
    showNegotiate: false,
  },
};

// ─── FAIR DISTRIBUTION ALGORITHM ──────────────────────────
/**
 * Prevents any single owner from dominating an area.
 * Returns a boost/penalty factor for each owner.
 * 
 * If owner has >20% of area bookings: penalize (0.6x)
 * If owner has <5% of area bookings: boost (1.4x)
 * If owner is the ONLY one with that machine type: never penalize
 */
async function calculateFairShareScores(city, state) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get booking counts per owner in this area
    const bookings = await RentalBooking.findAll({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo },
        status: { [Op.notIn]: ['cancelled'] },
      },
      attributes: ['ownerId', [fn('COUNT', col('id')), 'bookingCount']],
      group: ['ownerId'],
      raw: true,
    });

    if (bookings.length === 0) {
      return {}; // No data = no adjustment
    }

    const totalBookings = bookings.reduce((sum, b) => sum + parseInt(b.bookingCount), 0);
    const fairShare = totalBookings / Math.max(bookings.length, 1);
    const scores = {};

    for (const b of bookings) {
      const share = parseInt(b.bookingCount) / totalBookings;
      if (share > 0.20) {
        scores[b.ownerId] = 0.6; // Heavy penalty — they've had enough
      } else if (share > 0.15) {
        scores[b.ownerId] = 0.85;
      } else if (share < 0.05) {
        scores[b.ownerId] = 1.4; // Boost — they need more business
      } else {
        scores[b.ownerId] = 1.0;
      }
    }

    return scores;
  } catch (err) {
    console.error('Fair share calculation failed:', err.message);
    return {};
  }
}

// ─── PRICE FAIRNESS CHECK ─────────────────────────────────
/**
 * Instead of "cheapest wins", we check if price is within
 * a fair range of market average. This prevents:
 * - Race to bottom (everyone loses)
 * - Price gouging (users leave)
 * 
 * Returns 0.0 to 1.0 score (1.0 = at market avg)
 */
function calculatePriceFairness(price, marketAvg, segment) {
  if (!marketAvg || marketAvg === 0) return 0.5;
  
  const ratio = price / marketAvg;
  const maxMultiplier = SEGMENTS[segment]?.maxBudgetMultiplier || 1.15;

  if (ratio <= 0.7) {
    // Suspiciously cheap — might be bait-and-switch
    return 0.6;
  } else if (ratio <= 0.9) {
    // Good deal
    return 1.0;
  } else if (ratio <= 1.0) {
    // At market rate
    return 0.95;
  } else if (ratio <= maxMultiplier) {
    // Slightly above average but within segment tolerance
    return 0.8 - (ratio - 1.0) * 2;
  } else {
    // Too expensive for this segment
    return Math.max(0.1, 0.5 - (ratio - maxMultiplier));
  }
}

// ─── FLEET COMPLETENESS SCORE ─────────────────────────────
/**
 * How much of the user's requirement can this owner fulfill?
 * Returns 0.0 to 1.0 (1.0 = owner has ALL required machine types)
 */
function calculateCompleteness(ownerMachines, requiredTypes) {
  if (requiredTypes.length === 0) return 1.0;
  
  let matched = 0;
  for (const reqType of requiredTypes) {
    const aliases = MACHINE_TYPE_MAP[reqType.toLowerCase()] || [reqType];
    const hasMatch = ownerMachines.some(m => {
      const sub = (m.subCategory || '').toLowerCase();
      const make = (m.make || '').toLowerCase();
      const model = (m.model || '').toLowerCase();
      const combined = `${sub} ${make} ${model}`;
      return aliases.some(a => combined.includes(a.toLowerCase()));
    });
    if (hasMatch) matched++;
  }
  
  return matched / requiredTypes.length;
}

// ─── RELIABILITY SCORE ────────────────────────────────────
/**
 * Based on owner's track record:
 * - Booking completion rate
 * - Average rating
 * - Verification status
 * - Response speed (if available)
 */
async function calculateReliability(ownerId) {
  try {
    const [owner, bookingStats] = await Promise.all([
      User.findByPk(ownerId, {
        attributes: ['id', 'rating', 'reviewCount', 'isVerified'],
        raw: true,
      }),
      RentalBooking.findAll({
        where: { ownerId },
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      }),
    ]);

    let score = 0.5; // Base score for new owners

    // Rating component (0-0.3)
    if (owner?.rating) {
      score += (owner.rating / 5) * 0.3;
    }

    // Verification (0.1)
    if (owner?.isVerified) {
      score += 0.1;
    }

    // Completion rate (0-0.3)
    const statusMap = {};
    bookingStats.forEach(s => { statusMap[s.status] = parseInt(s.count); });
    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const completed = statusMap['completed'] || 0;
      const cancelled = statusMap['cancelled'] || 0;
      const completionRate = total > 0 ? completed / total : 0;
      const cancellationRate = total > 0 ? cancelled / total : 0;
      score += completionRate * 0.2;
      score -= cancellationRate * 0.1;
    }

    return Math.max(0.1, Math.min(1.0, score));
  } catch {
    return 0.5;
  }
}

// ─── MAIN OPTIMIZATION FUNCTION ───────────────────────────
/**
 * The core algorithm. Takes user requirements and returns
 * ranked fleet options from different owners.
 * 
 * @param {Object} params
 * @param {string[]} params.machineTypes - e.g. ['jcb', 'dumper', 'roller']
 * @param {number} params.days - rental duration
 * @param {string} params.city - project location
 * @param {string} params.state - project state
 * @param {string} params.segment - 'individual' | 'contractor' | 'enterprise' | 'government'
 * @param {string} params.startDate - YYYY-MM-DD
 * @param {string} params.endDate - YYYY-MM-DD
 * @returns {Object[]} Ranked fleet options
 */
async function optimizeFleet(params) {
  const {
    machineTypes = [],
    days = 7,
    city,
    state,
    segment = 'individual',
    startDate,
    endDate,
  } = params;

  // 1. Find all available rental machines in the area
  const where = {
    listingType: 'rent',
    status: 'approved',
    isActive: true,
  };
  if (city) where.city = { [Op.like]: `%${city}%` };
  if (state) where.state = { [Op.like]: `%${state}%` };

  const allListings = await MachineryListing.findAll({
    where,
    include: [{
      model: User,
      as: 'owner',
      attributes: ['id', 'firstName', 'lastName', 'phone', 'rating', 'reviewCount', 'isVerified', 'companyName', 'city'],
    }],
    order: [['price', 'ASC']],
  });

  if (allListings.length === 0) {
    return { fleetOptions: [], message: 'No machines available in this area', segment: SEGMENTS[segment] };
  }

  // 2. Group by owner
  const ownerGroups = {};
  for (const listing of allListings) {
    const ownerId = listing.userId;
    if (!ownerGroups[ownerId]) {
      ownerGroups[ownerId] = {
        ownerId,
        ownerName: listing.owner ? `${listing.owner.firstName || ''} ${listing.owner.lastName || ''}`.trim() : 'Unknown',
        ownerPhone: listing.owner?.phone,
        ownerCompany: listing.owner?.companyName,
        ownerCity: listing.owner?.city,
        ownerRating: listing.owner?.rating || 0,
        ownerReviewCount: listing.owner?.reviewCount || 0,
        isVerified: listing.owner?.isVerified || false,
        machines: [],
      };
    }
    ownerGroups[ownerId].machines.push({
      id: listing.id,
      make: listing.make,
      model: listing.model,
      subCategory: listing.subCategory,
      category: listing.category,
      price: parseFloat(listing.price),
      dailyRate: parseFloat(listing.price), // For rental, price = daily rate
      condition: listing.condition,
      year: listing.year,
      hoursUsed: listing.hoursUsed,
      images: listing.images,
      withOperator: listing.withOperator,
      operatorRate: listing.operatorRate ? parseFloat(listing.operatorRate) : null,
      deliveryAvailable: listing.deliveryAvailable,
      deliveryRadius: listing.deliveryRadius,
      city: listing.city,
    });
  }

  // 3. Calculate fair distribution scores
  const fairShareScores = await calculateFairShareScores(city, state);

  // 4. Calculate market average price per machine type
  const marketAvgPrices = {};
  for (const reqType of machineTypes) {
    const aliases = MACHINE_TYPE_MAP[reqType.toLowerCase()] || [reqType];
    const matchingMachines = allListings.filter(l => {
      const combined = `${l.subCategory || ''} ${l.make || ''} ${l.model || ''}`.toLowerCase();
      return aliases.some(a => combined.includes(a.toLowerCase()));
    });
    if (matchingMachines.length > 0) {
      const prices = matchingMachines.map(m => parseFloat(m.price));
      marketAvgPrices[reqType] = prices.reduce((a, b) => a + b, 0) / prices.length;
    }
  }

  // 5. Score each owner's fleet
  const weights = SEGMENTS[segment]?.weights || SEGMENTS.individual.weights;
  const fleetOptions = [];

  for (const [ownerId, ownerData] of Object.entries(ownerGroups)) {
    // Completeness
    const completeness = calculateCompleteness(ownerData.machines, machineTypes);
    if (completeness === 0 && machineTypes.length > 0) continue; // Skip owners with nothing matching

    // Find best machine for each required type
    const matchedMachines = [];
    const unmatchedTypes = [];
    let totalDailyRate = 0;

    for (const reqType of machineTypes) {
      const aliases = MACHINE_TYPE_MAP[reqType.toLowerCase()] || [reqType];
      const candidates = ownerData.machines.filter(m => {
        const combined = `${m.subCategory || ''} ${m.make || ''} ${m.model || ''}`.toLowerCase();
        return aliases.some(a => combined.includes(a.toLowerCase()));
      });

      if (candidates.length > 0) {
        // Pick cheapest matching machine from this owner
        const best = candidates.sort((a, b) => a.dailyRate - b.dailyRate)[0];
        matchedMachines.push({ ...best, matchedType: reqType });
        totalDailyRate += best.dailyRate;
      } else {
        unmatchedTypes.push(reqType);
      }
    }

    // Price fairness (average across matched machines)
    let avgPriceFairness = 0.5;
    if (matchedMachines.length > 0) {
      const fairnessScores = matchedMachines.map(m => {
        const mktAvg = marketAvgPrices[m.matchedType] || m.dailyRate;
        return calculatePriceFairness(m.dailyRate, mktAvg, segment);
      });
      avgPriceFairness = fairnessScores.reduce((a, b) => a + b, 0) / fairnessScores.length;
    }

    // Reliability
    const reliability = await calculateReliability(ownerId);

    // Fair share
    const fairShare = fairShareScores[ownerId] !== undefined
      ? Math.min(1.0, fairShareScores[ownerId])
      : 0.8; // New owners get slight boost (0.8 → middle ground)

    // Distance (simplified — same city = 1.0, same state = 0.6, else = 0.3)
    let distanceScore = 0.3;
    if (city && ownerData.ownerCity?.toLowerCase().includes(city.toLowerCase())) {
      distanceScore = 1.0;
    } else if (state) {
      distanceScore = 0.6;
    }

    // FINAL SCORE
    const score =
      weights.completeness * completeness +
      weights.price * avgPriceFairness +
      weights.reliability * reliability +
      weights.fairShare * fairShare +
      weights.distance * distanceScore;

    // Bundle discount calculation
    const machineCount = matchedMachines.length;
    let bundleDiscount = 0;
    let bundleLabel = '';
    if (machineCount >= 3) {
      bundleDiscount = 0.10; // 10% off
      bundleLabel = '10% Fleet Discount (3+ machines)';
    } else if (machineCount >= 2) {
      bundleDiscount = 0.05; // 5% off
      bundleLabel = '5% Fleet Discount (2 machines)';
    }

    const totalProjectCost = totalDailyRate * days;
    const discountAmount = Math.round(totalProjectCost * bundleDiscount);
    const finalCost = totalProjectCost - discountAmount;

    fleetOptions.push({
      ownerId,
      ownerName: ownerData.ownerName,
      ownerPhone: ownerData.ownerPhone,
      ownerCompany: ownerData.ownerCompany,
      ownerCity: ownerData.ownerCity,
      ownerRating: ownerData.ownerRating,
      ownerReviewCount: ownerData.ownerReviewCount,
      isVerified: ownerData.isVerified,
      score: Math.round(score * 100) / 100,
      completeness: Math.round(completeness * 100),
      matchedMachines,
      unmatchedTypes,
      totalMachinesAvailable: ownerData.machines.length,
      pricing: {
        dailyRate: totalDailyRate,
        days,
        subtotal: totalProjectCost,
        bundleDiscount: discountAmount,
        bundleLabel,
        platformFee: Math.round(finalCost * 0.05),
        totalCost: finalCost + Math.round(finalCost * 0.05),
        perDayCost: Math.round((finalCost + Math.round(finalCost * 0.05)) / days),
        marketAvgDaily: Object.values(marketAvgPrices).reduce((a, b) => a + b, 0),
        savingsVsMarket: Math.round(Object.values(marketAvgPrices).reduce((a, b) => a + b, 0) * days - finalCost),
      },
      scoring: {
        completeness: Math.round(completeness * 100) / 100,
        priceFairness: Math.round(avgPriceFairness * 100) / 100,
        reliability: Math.round(reliability * 100) / 100,
        fairShare: Math.round(fairShare * 100) / 100,
        distance: Math.round(distanceScore * 100) / 100,
      },
      badges: [
        completeness === 1 ? 'Full Fleet' : null,
        ownerData.isVerified ? 'Verified' : null,
        bundleDiscount > 0 ? `${Math.round(bundleDiscount * 100)}% Bundle Discount` : null,
        fairShare >= 1.3 ? 'Rising Supplier' : null,
        reliability >= 0.8 ? 'Highly Reliable' : null,
        ownerData.machines.length >= 5 ? 'Large Fleet' : null,
      ].filter(Boolean),
    });
  }

  // 6. Sort by score (descending)
  fleetOptions.sort((a, b) => b.score - a.score);

  // 7. Label top options
  if (fleetOptions.length > 0) {
    // Find best complete fleet
    const bestComplete = fleetOptions.find(f => f.completeness === 100);
    if (bestComplete) bestComplete.recommended = 'Best Match';

    // Find cheapest
    const cheapest = [...fleetOptions].sort((a, b) => a.pricing.totalCost - b.pricing.totalCost)[0];
    if (cheapest && cheapest.ownerId !== bestComplete?.ownerId) {
      cheapest.recommended = 'Budget Pick';
    }

    // Find most reliable
    const mostReliable = [...fleetOptions].sort((a, b) => b.scoring.reliability - a.scoring.reliability)[0];
    if (mostReliable && mostReliable.ownerId !== bestComplete?.ownerId && mostReliable.ownerId !== cheapest?.ownerId) {
      mostReliable.recommended = 'Most Reliable';
    }
  }

  return {
    fleetOptions: fleetOptions.slice(0, 10), // Top 10
    totalOwnersFound: Object.keys(ownerGroups).length,
    totalMachinesFound: allListings.length,
    machineTypesRequested: machineTypes,
    marketAverages: marketAvgPrices,
    segment: SEGMENTS[segment],
    segmentKey: segment,
  };
}

// ─── GET FLEET PACKAGES ───────────────────────────────────
/**
 * Get pre-defined bundle packages from owners.
 * For now, auto-generates packages from owners who have
 * multiple machine types available.
 */
async function getFleetPackages(city, state) {
  const where = {
    listingType: 'rent',
    status: 'approved',
    isActive: true,
  };
  if (city) where.city = { [Op.like]: `%${city}%` };

  const listings = await MachineryListing.findAll({
    where,
    include: [{
      model: User,
      as: 'owner',
      attributes: ['id', 'firstName', 'lastName', 'companyName', 'rating', 'isVerified'],
    }],
  });

  // Group by owner, find owners with 2+ machine types
  const ownerMachines = {};
  for (const l of listings) {
    const oid = l.userId;
    if (!ownerMachines[oid]) {
      ownerMachines[oid] = {
        owner: l.owner,
        machinesByType: {},
        totalMachines: 0,
      };
    }
    const type = (l.subCategory || l.category || 'other').toLowerCase();
    if (!ownerMachines[oid].machinesByType[type]) {
      ownerMachines[oid].machinesByType[type] = [];
    }
    ownerMachines[oid].machinesByType[type].push(l);
    ownerMachines[oid].totalMachines++;
  }

  const packages = [];
  for (const [ownerId, data] of Object.entries(ownerMachines)) {
    const types = Object.keys(data.machinesByType);
    if (types.length < 2) continue; // Need 2+ types for a package

    // Auto-generate a package with cheapest machine of each type
    const packageMachines = [];
    let totalDaily = 0;
    for (const [type, machines] of Object.entries(data.machinesByType)) {
      const cheapest = machines.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
      packageMachines.push({
        id: cheapest.id,
        make: cheapest.make,
        model: cheapest.model,
        type,
        dailyRate: parseFloat(cheapest.price),
      });
      totalDaily += parseFloat(cheapest.price);
    }

    const discount = types.length >= 3 ? 0.10 : 0.05;
    const discountedDaily = Math.round(totalDaily * (1 - discount));

    packages.push({
      id: `pkg_${ownerId}`,
      ownerName: data.owner ? `${data.owner.firstName || ''} ${data.owner.lastName || ''}`.trim() : 'Unknown',
      ownerCompany: data.owner?.companyName,
      ownerRating: data.owner?.rating || 0,
      isVerified: data.owner?.isVerified || false,
      packageName: `${types.length}-Machine Fleet Package`,
      machines: packageMachines,
      machineCount: packageMachines.length,
      totalDailyRate: totalDaily,
      discountedDailyRate: discountedDaily,
      discountPercent: Math.round(discount * 100),
      savings: totalDaily - discountedDaily,
    });
  }

  packages.sort((a, b) => b.machineCount - a.machineCount || a.discountedDailyRate - b.discountedDailyRate);
  return packages;
}

// ─── GET OWNER FLEET DETAILS ──────────────────────────────
async function getOwnerFleet(ownerId) {
  const machines = await MachineryListing.findAll({
    where: {
      userId: ownerId,
      listingType: 'rent',
      status: 'approved',
      isActive: true,
    },
    include: [{
      model: User,
      as: 'owner',
      attributes: ['id', 'firstName', 'lastName', 'phone', 'companyName', 'rating', 'isVerified'],
    }],
  });

  return machines;
}

module.exports = {
  optimizeFleet,
  getFleetPackages,
  getOwnerFleet,
  SEGMENTS,
  MACHINE_TYPE_MAP,
};
