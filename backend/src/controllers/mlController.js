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
