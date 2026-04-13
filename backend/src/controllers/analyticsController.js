/**
 * Analytics Controller — Campaign tracking, demand forecasting, marketing analytics, sitemap.
 */
const { CampaignVisit, MachineryListing, User } = require('../models');
const { getCategoryDemand, getPriceTrends, getSupplyDemandGaps, getSeasonalPatterns } = require('../services/demandForecaster');
const { generateSitemapEntry } = require('../services/seoScorer');
const { Op, fn, col, literal } = require('sequelize');

// ─── Track Campaign Visit ────────────────────────────
exports.trackVisit = async (req, res) => {
  try {
    const { sessionId, source, medium, campaign, content, term, landingPage, referrer, device, browser } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });

    // Check if session visit already exists
    let visit = await CampaignVisit.findOne({ where: { sessionId } });
    if (visit) {
      await visit.update({ pageViews: visit.pageViews + 1, bounced: false });
      return res.json({ visit, updated: true });
    }

    visit = await CampaignVisit.create({
      sessionId,
      userId: req.userId || null,
      source: source || (referrer ? new URL(referrer).hostname.replace('www.', '') : 'direct'),
      medium: medium || (referrer ? 'referral' : 'direct'),
      campaign, content, term, landingPage, referrer, device, browser,
      ipAddress: req.ip,
      userAgent: (req.headers['user-agent'] || '').slice(0, 500),
    });

    res.status(201).json({ visit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Track Conversion ────────────────────────────────
exports.trackConversion = async (req, res) => {
  try {
    const { sessionId, conversionType } = req.body;
    if (!sessionId || !conversionType) return res.status(400).json({ message: 'sessionId and conversionType required' });

    const visit = await CampaignVisit.findOne({ where: { sessionId } });
    if (!visit) return res.status(404).json({ message: 'Session not found' });

    const hierarchy = ['none', 'registered', 'listed', 'booked', 'subscribed'];
    const currentLevel = hierarchy.indexOf(visit.conversionType);
    const newLevel = hierarchy.indexOf(conversionType);

    if (newLevel > currentLevel) {
      await visit.update({
        conversionType,
        convertedAt: new Date(),
        userId: req.userId || visit.userId,
      });
    }

    res.json({ visit, upgraded: newLevel > currentLevel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Campaign Analytics (Admin) ──────────────────────
exports.getCampaignAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 86400000);

    // By source
    const bySource = await CampaignVisit.findAll({
      attributes: ['source', [fn('COUNT', col('id')), 'visits'], [fn('SUM', literal("CASE WHEN \"conversionType\" != 'none' THEN 1 ELSE 0 END")), 'conversions']],
      where: { createdAt: { [Op.gte]: since } },
      group: ['source'],
      order: [[literal('visits'), 'DESC']],
      limit: 10,
      raw: true,
    }).catch(() => []);

    // By campaign
    const byCampaign = await CampaignVisit.findAll({
      attributes: ['campaign', [fn('COUNT', col('id')), 'visits'], [fn('SUM', literal("CASE WHEN \"conversionType\" != 'none' THEN 1 ELSE 0 END")), 'conversions']],
      where: { createdAt: { [Op.gte]: since }, campaign: { [Op.ne]: null } },
      group: ['campaign'],
      order: [[literal('visits'), 'DESC']],
      limit: 10,
      raw: true,
    }).catch(() => []);

    // Overall funnel
    const totalVisits = await CampaignVisit.count({ where: { createdAt: { [Op.gte]: since } } }).catch(() => 0);
    const registered = await CampaignVisit.count({ where: { createdAt: { [Op.gte]: since }, conversionType: { [Op.in]: ['registered', 'listed', 'booked', 'subscribed'] } } }).catch(() => 0);
    const listed = await CampaignVisit.count({ where: { createdAt: { [Op.gte]: since }, conversionType: { [Op.in]: ['listed', 'booked', 'subscribed'] } } }).catch(() => 0);
    const booked = await CampaignVisit.count({ where: { createdAt: { [Op.gte]: since }, conversionType: { [Op.in]: ['booked', 'subscribed'] } } }).catch(() => 0);

    // Device breakdown
    const byDevice = await CampaignVisit.findAll({
      attributes: ['device', [fn('COUNT', col('id')), 'count']],
      where: { createdAt: { [Op.gte]: since }, device: { [Op.ne]: null } },
      group: ['device'],
      raw: true,
    }).catch(() => []);

    res.json({
      period: { days: Number(days), since },
      funnel: { visits: totalVisits, registered, listed, booked },
      bySource,
      byCampaign,
      byDevice,
      conversionRate: totalVisits > 0 ? Math.round((registered / totalVisits) * 10000) / 100 : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Demand Forecast ─────────────────────────────────
exports.getDemandForecast = async (req, res) => {
  try {
    const [gaps, priceTrends, seasonal] = await Promise.all([
      getSupplyDemandGaps(),
      getPriceTrends(req.query.category || null, Number(req.query.months) || 12),
      getSeasonalPatterns(),
    ]);

    res.json({ gaps, priceTrends, seasonal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Market Trends ───────────────────────────────────
exports.getMarketTrends = async (req, res) => {
  try {
    const { category, months = 6 } = req.query;
    const priceTrends = await getPriceTrends(category, Number(months));
    const demand = await getCategoryDemand(Number(months));
    res.json({ priceTrends, demand });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── XML Sitemap ─────────────────────────────────────
exports.getSitemap = async (req, res) => {
  try {
    const listings = await MachineryListing.findAll({
      where: { status: 'approved', isActive: true },
      attributes: ['id', 'isFeatured', 'isVerified', 'updatedAt', 'createdAt'],
      order: [['updatedAt', 'DESC']],
      limit: 5000,
      raw: true,
    });

    const baseUrl = process.env.FRONTEND_URL || 'https://yantrasetu.com';
    const entries = listings.map(l => generateSitemapEntry(l, baseUrl));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/browse</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/parts</loc><changefreq>daily</changefreq><priority>0.7</priority></url>
  <url><loc>${baseUrl}/operators</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>
  <url><loc>${baseUrl}/mechanics</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>
  <url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
${entries.map(e => `  <url><loc>${e.loc}</loc><lastmod>${new Date(e.lastmod).toISOString()}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Referral Stats ──────────────────────────────────
exports.getReferralStats = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const referralCode = user.referralCode || user.id.slice(0, 8).toUpperCase();
    if (!user.referralCode) {
      await user.update({ referralCode });
    }

    const referredCount = await User.count({ where: { referredBy: referralCode } }).catch(() => 0);
    const referredUsers = await User.findAll({
      where: { referredBy: referralCode },
      attributes: ['id', 'firstName', 'lastName', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.json({
      referralCode,
      referralLink: `${process.env.FRONTEND_URL || 'https://yantrasetu.com'}/register?ref=${referralCode}`,
      referredCount,
      referredUsers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Referral Leaderboard ────────────────────────────
exports.getReferralLeaderboard = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'referralCode', 'city'],
      where: { referralCode: { [Op.ne]: null } },
      raw: true,
    });

    const scored = await Promise.all(users.map(async u => {
      const count = await User.count({ where: { referredBy: u.referralCode } }).catch(() => 0);
      return { ...u, referralCount: count };
    }));

    scored.sort((a, b) => b.referralCount - a.referralCount);
    res.json({ leaderboard: scored.filter(u => u.referralCount > 0).slice(0, 20) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
