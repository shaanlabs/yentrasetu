const { Review, User } = require('../models');
const { Op } = require('sequelize');

exports.createReview = async (req, res) => {
  try {
    const { revieweeId, reviewType, entityId, rating, title, comment, punctualityRating, qualityRating, communicationRating, valueRating } = req.body;
    if (req.user.id === revieweeId) return res.status(400).json({ message: 'Cannot review yourself' });
    const review = await Review.create({ reviewerId: req.user.id, revieweeId, reviewType, entityId, rating, title, comment, punctualityRating, qualityRating, communicationRating, valueRating });
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
      ], order: [['createdAt', 'DESC']], limit: parseInt(limit), offset,
    });
    res.json({ reviews: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.respondToReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.revieweeId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await review.update({ response: req.body.response, respondedAt: new Date() });
    res.json({ message: 'Response added', review });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
