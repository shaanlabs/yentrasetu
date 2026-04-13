/**
 * Demand Forecaster
 * Time-series analysis: moving averages, seasonal decomposition, supply-demand gaps.
 */
const { MachineryListing, RentalBooking } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── Category demand over time ────────────────────────
async function getCategoryDemand(months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const dialect = sequelize.getDialect();

  // Listings created per category per month (supply)
  let dateExpr;
  if (dialect === 'sqlite') {
    dateExpr = [literal("strftime('%Y-%m', \"createdAt\")"), 'month'];
  } else {
    dateExpr = [fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'month'];
  }

  const supply = await MachineryListing.findAll({
    attributes: ['category', dateExpr, [fn('COUNT', col('id')), 'count']],
    where: { createdAt: { [Op.gte]: startDate } },
    group: ['category', dialect === 'sqlite' ? literal("strftime('%Y-%m', \"createdAt\")") : fn('TO_CHAR', col('createdAt'), 'YYYY-MM')],
    order: [[literal('month'), 'ASC']],
    raw: true,
  }).catch(() => []);

  // Bookings per category per month (demand)
  const demand = await RentalBooking.findAll({
    attributes: [
      dateExpr,
      [fn('COUNT', col('RentalBooking.id')), 'count'],
    ],
    include: [{
      model: MachineryListing,
      as: 'listing',
      attributes: ['category'],
    }],
    where: { createdAt: { [Op.gte]: startDate } },
    group: [
      dialect === 'sqlite' ? literal("strftime('%Y-%m', \"RentalBooking\".\"createdAt\")") : fn('TO_CHAR', col('RentalBooking.createdAt'), 'YYYY-MM'),
      'listing.category',
    ],
    raw: true,
  }).catch(() => []);

  return { supply, demand };
}

// ─── Price trends by category ─────────────────────────
async function getPriceTrends(category = null, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const dialect = sequelize.getDialect();
  const dateExpr = dialect === 'sqlite'
    ? [literal("strftime('%Y-%m', \"createdAt\")"), 'month']
    : [fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'month'];

  const where = { createdAt: { [Op.gte]: startDate }, price: { [Op.gt]: 0 }, status: { [Op.in]: ['approved', 'sold', 'rented'] } };
  if (category) where.category = category;

  const trends = await MachineryListing.findAll({
    attributes: [
      'category',
      dateExpr,
      [fn('AVG', col('price')), 'avgPrice'],
      [fn('MIN', col('price')), 'minPrice'],
      [fn('MAX', col('price')), 'maxPrice'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where,
    group: ['category', dialect === 'sqlite' ? literal("strftime('%Y-%m', \"createdAt\")") : fn('TO_CHAR', col('createdAt'), 'YYYY-MM')],
    order: [[literal('month'), 'ASC']],
    raw: true,
  }).catch(() => []);

  return trends;
}

// ─── Supply-Demand Gap Analysis ───────────────────────
async function getSupplyDemandGaps() {
  const categories = ['construction', 'mining', 'agriculture', 'industrial'];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const gaps = await Promise.all(categories.map(async category => {
    const [activeListings, recentBookings, recentViews] = await Promise.all([
      MachineryListing.count({ where: { category, status: 'approved', isActive: true } }),
      RentalBooking.count({
        where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
        include: [{ model: MachineryListing, as: 'listing', where: { category }, attributes: [] }],
      }).catch(() => 0),
      MachineryListing.sum('viewCount', { where: { category, status: 'approved', createdAt: { [Op.gte]: thirtyDaysAgo } } }).catch(() => 0),
    ]);

    // Demand signal = bookings * 10 + view velocity
    const demandSignal = recentBookings * 10 + (recentViews || 0) / 100;
    const supplySignal = activeListings;
    const gap = supplySignal > 0 ? (demandSignal / supplySignal) : demandSignal;

    let status;
    if (gap > 2) status = 'high_demand';
    else if (gap > 1) status = 'balanced';
    else if (gap > 0.5) status = 'oversupply';
    else status = 'low_activity';

    return {
      category,
      activeListings,
      recentBookings,
      recentViews: recentViews || 0,
      demandSignal: Math.round(demandSignal * 10) / 10,
      supplySignal,
      gap: Math.round(gap * 100) / 100,
      status,
      recommendation: gap > 2
        ? `High demand for ${category} equipment. Great time to list!`
        : gap < 0.5
          ? `Low activity in ${category}. Consider competitive pricing.`
          : `${category} market is balanced.`,
    };
  }));

  return gaps;
}

// ─── Seasonal patterns ────────────────────────────────
async function getSeasonalPatterns() {
  const dialect = sequelize.getDialect();
  const monthExpr = dialect === 'sqlite'
    ? [literal("CAST(strftime('%m', \"createdAt\") AS INTEGER)"), 'month']
    : [fn('EXTRACT', literal('MONTH FROM "createdAt"')), 'month'];

  const patterns = await MachineryListing.findAll({
    attributes: ['category', monthExpr, [fn('COUNT', col('id')), 'count']],
    where: { status: { [Op.in]: ['approved', 'sold', 'rented'] } },
    group: ['category', dialect === 'sqlite' ? literal("CAST(strftime('%m', \"createdAt\") AS INTEGER)") : fn('EXTRACT', literal('MONTH FROM "createdAt"'))],
    order: [[literal('month'), 'ASC']],
    raw: true,
  }).catch(() => []);

  return patterns;
}

module.exports = { getCategoryDemand, getPriceTrends, getSupplyDemandGaps, getSeasonalPatterns };
