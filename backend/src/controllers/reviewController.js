const { Review, User, RentalBooking } = require('../models');
const { Op, fn, col } = require('sequelize');
const { createNotification } = require('./notificationController');

// Recalculate and persist a user's average rating + review count
async function recalcUserRating(userId) {
  try {
    const result = await Review.findOne({
      where: { revieweeId: userId, isVisible: true },
      attributes: [
        [fn('AVG', col('rating')), 'avgRating'],
        [fn('COUNT', col('id')), 'total'],
      ],
      raw: true,
    });
    const avg = parseFloat(result.avgRating) || 0;
    const count = parseInt(result.total) || 0;
    await User.update(
      { rating: Math.round(avg * 10) / 10, reviewCount: count },
      { where: { id: userId } }
    );
  } catch (e) { console.error('Rating recalc error:', e.message); }
}

exports.createReview = async (req, res) => {
  try {
    const { revieweeId, reviewType, entityId, rating, title, comment, punctualityRating, qualityRating, communicationRating, valueRating } = req.body;

    if (req.userId === revieweeId) return res.status(400).json({ message: 'Cannot review yourself' });

    // ─── Review gating: verify transaction proof ──────
    let isVerified = false;

    if (reviewType === 'rental' || reviewType === 'listing') {
      // Must have a completed booking between reviewer and reviewee
      const completedBooking = await RentalBooking.findOne({
        where: {
          status: 'completed',
          [Op.or]: [
            { renterId: req.userId, ownerId: revieweeId },
            { renterId: revieweeId, ownerId: req.userId },
          ],
          ...(entityId ? { listingId: entityId } : {}),
        }
      });

      if (!completedBooking) {
        return res.status(403).json({
          message: 'You can only review someone after a completed rental transaction with them.'
        });
      }
      isVerified = true;

      // Prevent duplicate reviews for the same booking/entity
      const existingReview = await Review.findOne({
        where: {
          reviewerId: req.userId,
          revieweeId,
          reviewType,
          ...(entityId ? { entityId } : {}),
        }
      });
      if (existingReview) {
        return res.status(409).json({ message: 'You have already reviewed this transaction.' });
      }
    }

    // For 'user', 'operator', 'mechanic' types — allow without transaction proof but mark unverified
    if (reviewType === 'operator' || reviewType === 'mechanic') {
      // Check if there's any interaction (chat started, booking, etc.)
      // For demo: allow but mark as unverified
      isVerified = false;
    }

    const review = await Review.create({
      reviewerId: req.userId, revieweeId, reviewType, entityId,
      rating, title, comment,
      punctualityRating, qualityRating, communicationRating, valueRating,
      isVerified,
    });

    const reviewer = await User.findByPk(req.userId, { attributes: ['firstName', 'lastName'] });
    createNotification({
      userId: revieweeId,
      type: 'review_received',
      title: 'New Review Received ⭐',
      body: `${reviewer?.firstName || 'Someone'} gave you a ${rating}-star review.${isVerified ? ' (Verified Transaction)' : ''}`,
      data: { reviewId: review.id },
    });

    // Recalculate reviewee's aggregate rating
    await recalcUserRating(revieweeId);
    res.status(201).json({ message: 'Review submitted', review });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getReviews = async (req, res) => {
  try {
    const { userId, entityId, reviewType, page = 1, limit = 10 } = req.query;
    const where = { isVisible: true };
    if (userId) where.revieweeId = userId;
    if (entityId) where.entityId = entityId;
    if (reviewType) where.reviewType = reviewType;
    const offset = (page - 1) * limit;
    const { count, rows } = await Review.findAndCountAll({
      where, include: [
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'reviewee', attributes: ['id', 'firstName', 'lastName'] },
      ], order: [['isVerified', 'DESC'], ['createdAt', 'DESC']], limit: parseInt(limit), offset,
    });
    res.json({ reviews: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.respondToReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.revieweeId !== req.userId) return res.status(403).json({ message: 'Not authorized' });
    await review.update({ response: req.body.response, respondedAt: new Date() });
    res.json({ message: 'Response added', review });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
