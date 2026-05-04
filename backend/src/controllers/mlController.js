/**
 * ML Controller — Price prediction, recommendations, sentiment, trust scores.
 */
const { predictPrice, analyzeListingPrice } = require('../services/pricePrediction');
const { getSimilarListings, getPersonalizedRecommendations, getTrendingListings } = require('../services/recommendationEngine');
const { analyzeSentiment, calculateTrustScore } = require('../services/sentimentAnalyzer');
const { scoreListing, generateProductSchema, generateMetaTags } = require('../services/seoScorer');
const { calculateLeadScore, getTopLeads } = require('../services/leadScorer');
const { Review, User, MachineryListing, ActivityLog } = require('../models');
const { Op, fn, col } = require('sequelize');

// ─── Price Prediction ────────────────────────────────
exports.predictPriceEndpoint = async (req, res) => {
  try {
    const { category, condition, listingType, year, hoursUsed, city } = req.query;
    if (!category) return res.status(400).json({ message: 'category is required' });

    const result = predictPrice({ category, condition: condition || 'used', listingType: listingType || 'sale', year: year ? Number(year) : null, hoursUsed: hoursUsed ? Number(hoursUsed) : null, city });
    res.json({ prediction: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Price Analysis for a Listing ────────────────────
exports.analyzePriceEndpoint = async (req, res) => {
  try {
    const result = await analyzeListingPrice(req.params.id);
    if (!result) return res.status(404).json({ message: 'Listing not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Similar Listings ────────────────────────────────
exports.getSimilarEndpoint = async (req, res) => {
  try {
    const listings = await getSimilarListings(req.params.id, Number(req.query.limit) || 6);
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Personalized Recommendations ────────────────────
exports.getRecommendationsEndpoint = async (req, res) => {
  try {
    const { city, state, lat, lng } = req.query;
    const userId = req.userId || null;

    if (userId) {
      const recs = await getPersonalizedRecommendations(userId, { city, state, lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null });
      return res.json(recs);
    }

    // Non-authenticated: just return trending
    const trending = await getTrendingListings({ city, state, lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null, limit: 8 });
    res.json({ forYou: [], trending: trending.map(l => l.toJSON ? l.toJSON() : l) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Trending Near User ──────────────────────────────
exports.getTrendingEndpoint = async (req, res) => {
  try {
    const { city, state, lat, lng, radius, limit } = req.query;
    const listings = await getTrendingListings({
      city, state, lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null,
      radius: radius ? Number(radius) : 100, limit: limit ? Number(limit) : 8,
    });
    res.json({ listings: listings.map(l => l.toJSON ? l.toJSON() : l) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Seller Trust Score ──────────────────────────────
exports.getSellerTrustEndpoint = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName', 'isVerified', 'createdAt', 'rating', 'reviewCount'] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get reviews and analyze sentiment
    const reviews = await Review.findAll({
      where: { revieweeId: userId, isVisible: true },
      attributes: ['rating', 'comment', 'title'],
      raw: true,
    });

    const sentiments = reviews.map(r => analyzeSentiment((r.title || '') + ' ' + (r.comment || '')));
    const avgSentiment = sentiments.length > 0 ? sentiments.reduce((s, r) => s + r.normalized, 0) / sentiments.length : 0;
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const accountAge = Date.now() - new Date(user.createdAt).getTime();

    const trustScore = calculateTrustScore({ avgRating, reviewCount: reviews.length, avgSentiment, isVerified: user.isVerified, accountAge });

    // Sentiment summary
    const sentimentSummary = {
      positive: sentiments.filter(s => s.label === 'positive' || s.label === 'slightly_positive').length,
      neutral: sentiments.filter(s => s.label === 'neutral').length,
      negative: sentiments.filter(s => s.label === 'negative' || s.label === 'slightly_negative').length,
      avgScore: Math.round(avgSentiment * 100) / 100,
    };

    res.json({ userId, trustScore, sentimentSummary, reviewCount: reviews.length, avgRating: Math.round(avgRating * 10) / 10 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── SEO Score for Listing ───────────────────────────
exports.getSeoScoreEndpoint = async (req, res) => {
  try {
    const listing = await MachineryListing.findByPk(req.params.id, { raw: true });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const seoScore = scoreListing(listing);
    const schema = generateProductSchema(listing);
    const metaTags = generateMetaTags(listing);

    res.json({ seo: seoScore, schema, metaTags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Predict price inline (for create listing form) ──
exports.predictPriceInline = async (req, res) => {
  try {
    const data = req.body;
    const prediction = predictPrice(data);
    const seoScore = scoreListing(data);
    res.json({ prediction, seoScore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Track listing view (for recommendations) ───────
exports.trackView = async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'listingId required' });

    await ActivityLog.log({
      userId: req.userId || null,
      action: 'listing_viewed',
      targetType: 'listing',
      targetId: listingId,
      ipAddress: req.ip,
      userAgent: (req.headers['user-agent'] || '').slice(0, 500),
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Lead Scores (admin) ─────────────────────────────
exports.getLeadScoresEndpoint = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const leads = await getTopLeads(limit);
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── AI Work Estimation ──────────────────────────────
exports.workEstimate = async (req, res) => {
  try {
    const { projectType, durationDays, equipmentTypes, city, state } = req.body;
    if (!projectType || !durationDays) {
      return res.status(400).json({ message: 'projectType and durationDays are required' });
    }

    const duration = Number(durationDays);
    const equipmentList = equipmentTypes || ['excavator'];

    // Get average rental rates from database for each equipment type
    const estimates = [];
    let totalCost = 0;

    for (const eqType of equipmentList) {
      const listings = await MachineryListing.findAll({
        where: {
          listingType: 'rent',
          status: 'approved',
          ...(eqType ? { [Op.or]: [
            { category: { [Op.like]: `%${eqType}%` } },
            { subCategory: { [Op.like]: `%${eqType}%` } },
            { make: { [Op.like]: `%${eqType}%` } },
          ]} : {}),
        },
        attributes: ['rentalRateDaily', 'rentalRateWeekly', 'rentalRateMonthly', 'price'],
        limit: 50,
      });

      let avgDaily = 0;
      if (listings.length > 0) {
        const rates = listings.map(l => l.rentalRateDaily || l.price || 0).filter(r => r > 0);
        avgDaily = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 15000;
      } else {
        // Default rates by category
        const defaultRates = {
          excavator: 18000, crane: 25000, bulldozer: 20000, loader: 15000,
          forklift: 8000, generator: 5000, compressor: 4000, tractor: 6000,
        };
        avgDaily = defaultRates[eqType.toLowerCase()] || 12000;
      }

      const equipCost = Math.round(avgDaily * duration);
      const operatorCost = Math.round(duration * 1500); // avg operator cost
      const fuelEstimate = Math.round(duration * 3500); // avg fuel cost

      estimates.push({
        equipment: eqType,
        avgDailyRate: Math.round(avgDaily),
        rentalCost: equipCost,
        operatorCost,
        fuelEstimate,
        totalPerEquipment: equipCost + operatorCost + fuelEstimate,
        availableUnits: listings.length,
      });

      totalCost += equipCost + operatorCost + fuelEstimate;
    }

    // Add platform fees and taxes
    const platformFee = Math.round(totalCost * 0.08);
    const gst = Math.round((totalCost + platformFee) * 0.18);
    const grandTotal = totalCost + platformFee + gst;

    // AI recommendation
    let recommendation = '';
    if (duration >= 30) {
      recommendation = 'Monthly rental rates are 20-30% cheaper than daily rates for this duration. Consider negotiating a monthly deal.';
    } else if (duration >= 7) {
      recommendation = 'Weekly rates offer 10-15% savings over daily rates. Request weekly pricing from owners.';
    } else {
      recommendation = 'For short-term needs, consider equipment with operators included to save on hiring costs.';
    }

    res.json({
      success: true,
      estimate: {
        projectType,
        durationDays: duration,
        equipment: estimates,
        subtotal: totalCost,
        platformFee,
        gst,
        grandTotal,
        recommendation,
        confidence: listings => listings > 10 ? 'high' : listings > 3 ? 'medium' : 'low',
        method: 'market_average_regression',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── AI Equipment Health Score ───────────────────────
exports.equipmentHealthScore = async (req, res) => {
  try {
    const { category, make, model, year, hoursUsed, condition } = req.query;
    if (!category) return res.status(400).json({ message: 'category is required' });

    const currentYear = new Date().getFullYear();
    const age = year ? currentYear - Number(year) : 5;
    const hours = hoursUsed ? Number(hoursUsed) : 5000;

    // Health score calculation based on multiple factors
    let healthScore = 100;

    // Age factor (max 30 point deduction)
    const agePenalty = Math.min(30, age * 3);
    healthScore -= agePenalty;

    // Hours factor (max 30 point deduction)
    const hoursPenalty = Math.min(30, (hours / 1000) * 2.5);
    healthScore -= hoursPenalty;

    // Condition factor
    const conditionScores = { new: 0, refurbished: -5, used: -15 };
    healthScore += conditionScores[condition] || -15;

    healthScore = Math.max(10, Math.min(100, Math.round(healthScore)));

    // Depreciation forecast
    const baseValue = await getEstimatedValue(category, make, condition, age);
    const depreciationRates = [0.88, 0.78, 0.69, 0.61, 0.54]; // 1-5 years forward

    const depreciation = depreciationRates.map((rate, i) => ({
      year: currentYear + i + 1,
      estimatedValue: Math.round(baseValue * rate),
      depreciationPercent: Math.round((1 - rate) * 100),
    }));

    // Maintenance predictions
    const maintenanceItems = [];
    if (hours > 2000) maintenanceItems.push({ item: 'Hydraulic fluid change', urgency: hours > 5000 ? 'overdue' : 'upcoming', estimatedCost: 15000 });
    if (hours > 3000) maintenanceItems.push({ item: 'Filter replacement', urgency: hours > 6000 ? 'overdue' : 'upcoming', estimatedCost: 8000 });
    if (hours > 5000) maintenanceItems.push({ item: 'Undercarriage inspection', urgency: hours > 8000 ? 'critical' : 'upcoming', estimatedCost: 45000 });
    if (age > 5) maintenanceItems.push({ item: 'Engine overhaul assessment', urgency: age > 8 ? 'critical' : 'recommended', estimatedCost: 120000 });
    if (hours > 7000) maintenanceItems.push({ item: 'Track/tire replacement', urgency: 'upcoming', estimatedCost: 65000 });

    // Overall label
    let label;
    if (healthScore >= 80) label = 'excellent';
    else if (healthScore >= 60) label = 'good';
    else if (healthScore >= 40) label = 'fair';
    else if (healthScore >= 20) label = 'needs_attention';
    else label = 'poor';

    res.json({
      success: true,
      healthScore: {
        score: healthScore,
        label,
        breakdown: {
          age: { value: age, penalty: agePenalty, maxPenalty: 30 },
          hours: { value: hours, penalty: Math.round(hoursPenalty), maxPenalty: 30 },
          condition: { value: condition || 'used', adjustment: conditionScores[condition] || -15 },
        },
      },
      depreciation,
      maintenanceItems,
      estimatedCurrentValue: baseValue,
      recommendation: healthScore >= 60
        ? 'This equipment is in good condition for its age. Regular maintenance will preserve value.'
        : 'Consider scheduling a professional inspection. Deferred maintenance may accelerate depreciation.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: Get estimated value
async function getEstimatedValue(category, make, condition, age) {
  try {
    const similar = await MachineryListing.findAll({
      where: { category, listingType: 'sale', status: 'approved' },
      attributes: ['price'],
      limit: 20,
      order: [['createdAt', 'DESC']],
    });

    if (similar.length > 0) {
      const prices = similar.map(l => l.price).filter(p => p > 0);
      return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    }
  } catch {}

  // Default values by category
  const defaults = {
    construction: 2500000, mining: 3500000, agriculture: 800000, industrial: 1200000,
  };
  const base = defaults[category] || 1500000;
  const condMultiplier = condition === 'new' ? 1.0 : condition === 'refurbished' ? 0.7 : 0.55;
  const ageMultiplier = Math.max(0.2, 1 - (age * 0.08));
  return Math.round(base * condMultiplier * ageMultiplier);
}
