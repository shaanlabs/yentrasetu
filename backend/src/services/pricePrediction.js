/**
 * ML Price Prediction Engine
 * Pure JS multivariate linear regression for machinery pricing.
 * Trains on historical listing data — no external ML libraries needed.
 */
const { MachineryListing } = require('../models');
const { Op, fn, col } = require('sequelize');

// ─── Feature Encoding Maps ────────────────────────────
const CATEGORY_MAP = { construction: 0, mining: 1, agriculture: 2, industrial: 3 };
const CONDITION_MAP = { new: 1.0, refurbished: 0.6, used: 0.3 };
const TYPE_MAP = { sale: 0, rent: 1 };

// ─── Model State (in-memory) ──────────────────────────
let modelWeights = null;
let featureMeans = null;
let featureStds = null;
let trainedAt = null;
let trainingSamples = 0;

// ─── Feature Extraction ───────────────────────────────
function extractFeatures(listing) {
  const currentYear = new Date().getFullYear();
  return [
    CATEGORY_MAP[listing.category] ?? 2,
    CONDITION_MAP[listing.condition] ?? 0.3,
    TYPE_MAP[listing.listingType] ?? 0,
    listing.year ? (listing.year - 2000) / (currentYear - 2000) : 0.5,
    listing.hoursUsed ? Math.min(listing.hoursUsed / 20000, 1) : 0.5,
    listing.city ? (listing.city.toLowerCase().includes('mumbai') || listing.city.toLowerCase().includes('delhi') || listing.city.toLowerCase().includes('bengaluru') ? 1 : 0.5) : 0.5,
    1, // bias term
  ];
}

// ─── Normalize Features ───────────────────────────────
function normalize(features, means, stds) {
  return features.map((f, i) => {
    if (!stds || stds[i] === 0) return f;
    return (f - (means?.[i] || 0)) / (stds[i] || 1);
  });
}

// ─── Train Model (Gradient Descent) ───────────────────
async function trainModel() {
  try {
    const listings = await MachineryListing.findAll({
      where: { status: { [Op.in]: ['approved', 'sold', 'rented'] }, price: { [Op.gt]: 0 } },
      attributes: ['category', 'condition', 'listingType', 'year', 'hoursUsed', 'city', 'price'],
      raw: true,
      limit: 5000,
      order: [['createdAt', 'DESC']],
    });

    if (listings.length < 5) {
      console.log('⚠️ Not enough data to train price model (need 5+, have', listings.length, ')');
      return false;
    }

    // Extract features and targets
    const X = listings.map(extractFeatures);
    const y = listings.map(l => Math.log(Number(l.price) + 1)); // Log-transform price

    const n = X.length;
    const featureCount = X[0].length;

    // Calculate means and stds for normalization
    featureMeans = new Array(featureCount).fill(0);
    featureStds = new Array(featureCount).fill(0);

    for (let j = 0; j < featureCount; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += X[i][j];
      featureMeans[j] = sum / n;
    }
    for (let j = 0; j < featureCount; j++) {
      let sumSq = 0;
      for (let i = 0; i < n; i++) sumSq += (X[i][j] - featureMeans[j]) ** 2;
      featureStds[j] = Math.sqrt(sumSq / n) || 1;
    }

    // Normalize
    const Xn = X.map(row => normalize(row, featureMeans, featureStds));

    // Initialize weights
    const w = new Array(featureCount).fill(0);
    const lr = 0.01;
    const epochs = 500;

    // Gradient descent
    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradients = new Array(featureCount).fill(0);
      let totalLoss = 0;

      for (let i = 0; i < n; i++) {
        let pred = 0;
        for (let j = 0; j < featureCount; j++) pred += w[j] * Xn[i][j];
        const error = pred - y[i];
        totalLoss += error ** 2;
        for (let j = 0; j < featureCount; j++) gradients[j] += (2 / n) * error * Xn[i][j];
      }

      for (let j = 0; j < featureCount; j++) w[j] -= lr * gradients[j];

      if (epoch % 100 === 0) {
        console.log(`  Epoch ${epoch}: loss=${(totalLoss / n).toFixed(4)}`);
      }
    }

    modelWeights = w;
    trainedAt = new Date();
    trainingSamples = n;

    console.log(`✅ Price model trained on ${n} samples. Weights:`, w.map(v => v.toFixed(3)));
    return true;
  } catch (err) {
    console.error('❌ Price model training failed:', err.message);
    return false;
  }
}

// ─── Predict Price ────────────────────────────────────
function predictPrice(listingData) {
  if (!modelWeights) {
    // Fallback: category-based median
    const fallbackPrices = {
      construction: 2500000, mining: 3500000, agriculture: 800000, industrial: 1200000,
    };
    const base = fallbackPrices[listingData.category] || 1500000;
    const condMul = CONDITION_MAP[listingData.condition] || 0.5;
    const ageFactor = listingData.year ? Math.max(0.3, 1 - (new Date().getFullYear() - listingData.year) * 0.05) : 0.7;
    const estimated = Math.round(base * condMul * ageFactor);
    return { predicted: estimated, confidence: 'low', method: 'fallback', trainedOn: 0 };
  }

  const features = extractFeatures(listingData);
  const normalized = normalize(features, featureMeans, featureStds);

  let logPrice = 0;
  for (let j = 0; j < modelWeights.length; j++) logPrice += modelWeights[j] * normalized[j];

  const predicted = Math.round(Math.exp(logPrice) - 1);
  const confidence = trainingSamples > 50 ? 'high' : trainingSamples > 20 ? 'medium' : 'low';

  return {
    predicted: Math.max(10000, predicted),
    confidence,
    method: 'ml_regression',
    trainedOn: trainingSamples,
    trainedAt,
  };
}

// ─── Market Analysis ──────────────────────────────────
async function analyzeListingPrice(listingId) {
  const listing = await MachineryListing.findByPk(listingId, { raw: true });
  if (!listing) return null;

  const prediction = predictPrice(listing);
  const actualPrice = Number(listing.price);
  const diff = actualPrice - prediction.predicted;
  const diffPercent = Math.round((diff / prediction.predicted) * 100);

  // Get category average
  const avgResult = await MachineryListing.findOne({
    where: { category: listing.category, status: 'approved', price: { [Op.gt]: 0 } },
    attributes: [[fn('AVG', col('price')), 'avg'], [fn('COUNT', col('id')), 'count']],
    raw: true,
  });
  const categoryAvg = Math.round(Number(avgResult?.avg || 0));
  const categoryCount = Number(avgResult?.count || 0);

  let verdict;
  if (diffPercent < -15) verdict = 'great_deal';
  else if (diffPercent < -5) verdict = 'below_market';
  else if (diffPercent <= 5) verdict = 'fair_price';
  else if (diffPercent <= 15) verdict = 'above_market';
  else verdict = 'overpriced';

  return {
    listing: { id: listing.id, make: listing.make, model: listing.model, price: actualPrice },
    prediction,
    analysis: { diffPercent, verdict, categoryAvg, categoryCount },
  };
}

// Auto-train on startup (delayed)
setTimeout(() => {
  console.log('🧠 Starting price model training...');
  trainModel();
}, 5000);

// Re-train every 6 hours
setInterval(() => {
  console.log('🔄 Re-training price model...');
  trainModel();
}, 6 * 60 * 60 * 1000);

module.exports = { trainModel, predictPrice, analyzeListingPrice };
