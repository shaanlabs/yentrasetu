/**
 * Recommendation Engine
 * Content-based + collaborative filtering + location-aware trending.
 * No external libraries — pure JS cosine similarity and co-occurrence.
 */
const { MachineryListing, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const { iLikeFilter } = require('../config/dbHelpers');

// ─── Content-Based: Similar Listings ──────────────────
async function getSimilarListings(listingId, limit = 6) {
  const target = await MachineryListing.findByPk(listingId, { raw: true });
  if (!target) return [];

  // Find listings in same category, prefer same city, similar price range
  const priceRange = Number(target.price) * 0.5;
  const minPrice = Math.max(0, Number(target.price) - priceRange);
  const maxPrice = Number(target.price) + priceRange;

  const candidates = await MachineryListing.findAll({
    where: {
      id: { [Op.ne]: listingId },
      status: 'approved',
      isActive: true,
      category: target.category,
      price: { [Op.between]: [minPrice, maxPrice] },
    },
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'city'] }],
    limit: 30,
    order: [['viewCount', 'DESC']],
    raw: false,
  });

  // Score each candidate by similarity to target
  const scored = candidates.map(c => {
    let score = 0;
    // Same sub-category: +3
    if (c.subCategory === target.subCategory) score += 3;
    // Same make: +2
    if (c.make?.toLowerCase() === target.make?.toLowerCase()) score += 2;
    // Same condition: +1
    if (c.condition === target.condition) score += 1;
    // Same listing type: +1
    if (c.listingType === target.listingType) score += 1;
    // Price similarity (closer = higher score, max +2)
    const priceDiff = Math.abs(Number(c.price) - Number(target.price)) / Number(target.price);
    score += Math.max(0, 2 - priceDiff * 4);
    // Same city: +2
    if (c.city?.toLowerCase() === target.city?.toLowerCase()) score += 2;
    // Same state: +1
    if (c.state?.toLowerCase() === target.state?.toLowerCase()) score += 1;
    // Year similarity (+1 if within 3 years)
    if (target.year && c.year && Math.abs(c.year - target.year) <= 3) score += 1;
    // Verified bonus
    if (c.isVerified) score += 0.5;

    return { listing: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => ({ ...s.listing.toJSON(), similarityScore: Math.round(s.score * 10) / 10 }));
}

// ─── Collaborative: Users Who Viewed X Also Viewed Y ──
async function getCollaborativeRecommendations(userId, limit = 8) {
  try {
    // Get this user's recently viewed listings (from activity log)
    const { ActivityLog } = require('../models');
    const userViews = await ActivityLog.findAll({
      where: { userId, action: 'listing_viewed' },
      attributes: ['targetId'],
      order: [['createdAt', 'DESC']],
      limit: 20,
      raw: true,
    });

    if (userViews.length === 0) return [];

    const viewedIds = userViews.map(v => v.targetId).filter(Boolean);

    // Find other users who viewed the same listings
    const coViewers = await ActivityLog.findAll({
      where: {
        action: 'listing_viewed',
        targetId: { [Op.in]: viewedIds },
        userId: { [Op.ne]: userId },
      },
      attributes: ['userId'],
      group: ['userId'],
      raw: true,
      limit: 50,
    });

    if (coViewers.length === 0) return [];

    const coViewerIds = coViewers.map(v => v.userId);

    // Get listings those users viewed that current user hasn't
    const recommendations = await ActivityLog.findAll({
      where: {
        action: 'listing_viewed',
        userId: { [Op.in]: coViewerIds },
        targetId: { [Op.notIn]: viewedIds },
      },
      attributes: ['targetId', [fn('COUNT', col('targetId')), 'viewCount']],
      group: ['targetId'],
      order: [[literal('viewCount'), 'DESC']],
      limit: limit * 2,
      raw: true,
    });

    const recIds = recommendations.map(r => r.targetId).filter(Boolean);
    if (recIds.length === 0) return [];

    const listings = await MachineryListing.findAll({
      where: { id: { [Op.in]: recIds }, status: 'approved', isActive: true },
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] }],
      limit,
    });

    return listings;
  } catch (err) {
    console.error('Collaborative filtering error:', err.message);
    return [];
  }
}

// ─── Location-Based: Trending Near You ────────────────
async function getTrendingListings({ city, state, lat, lng, radius = 100, limit = 8 } = {}) {
  const where = { status: 'approved', isActive: true };
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Location filter
  if (lat && lng) {
    const latDeg = radius / 111;
    const lngDeg = radius / (111 * Math.cos(lat * Math.PI / 180));
    where.latitude = { [Op.between]: [lat - latDeg, lat + latDeg] };
    where.longitude = { [Op.between]: [lng - lngDeg, lng + lngDeg] };
  } else if (city) {
    where.city = iLikeFilter(city);
  } else if (state) {
    where.state = iLikeFilter(state);
  }

  // Time-decay weighted: recent views count more
  const listings = await MachineryListing.findAll({
    where,
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'city'] }],
    order: [['viewCount', 'DESC'], ['createdAt', 'DESC']],
    limit,
  });

  return listings;
}

// ─── Personalized Recommendations (combines all) ──────
async function getPersonalizedRecommendations(userId, { city, state, lat, lng } = {}) {
  const [collaborative, trending] = await Promise.all([
    getCollaborativeRecommendations(userId, 4),
    getTrendingListings({ city, state, lat, lng, limit: 4 }),
  ]);

  // Merge and deduplicate
  const seen = new Set();
  const results = { forYou: [], trending: [] };

  collaborative.forEach(l => {
    if (!seen.has(l.id)) { seen.add(l.id); results.forYou.push(l); }
  });

  trending.forEach(l => {
    const item = l.toJSON ? l.toJSON() : l;
    if (!seen.has(item.id)) { seen.add(item.id); results.trending.push(item); }
  });

  // If forYou is empty, fill with trending
  if (results.forYou.length === 0) {
    const extra = await getTrendingListings({ city, state, lat, lng, limit: 8 });
    extra.forEach(l => {
      const item = l.toJSON ? l.toJSON() : l;
      if (!seen.has(item.id)) { seen.add(item.id); results.forYou.push(item); }
    });
  }

  return results;
}

module.exports = { getSimilarListings, getCollaborativeRecommendations, getTrendingListings, getPersonalizedRecommendations };
