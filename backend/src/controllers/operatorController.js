const { OperatorProfile, User } = require('../models');
const { Op } = require('sequelize');

exports.createOrUpdateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'specialization', 'equipmentTypes', 'experience', 'description', 'dayRate', 'city', 'state', 'latitude', 'longitude', 'certifications', 'isAvailable', 'profileImage'];
    const data = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });

    const [profile, created] = await OperatorProfile.findOrCreate({
      where: { userId: req.userId }, defaults: { ...data, userId: req.userId },
    });
    if (!created) { await profile.update(data); }
    res.status(created ? 201 : 200).json({ message: created ? 'Profile created' : 'Profile updated', profile });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getOperators = async (req, res) => {
  try {
    const { page = 1, limit = 12, city, state, equipmentType, minRate, maxRate, isAvailable, sortBy = 'rating', sortOrder = 'DESC' } = req.query;
    const where = { isActive: true };
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (state) where.state = { [Op.like]: `%${state}%` };
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (minRate || maxRate) { where.dayRate = {}; if (minRate) where.dayRate[Op.gte] = minRate; if (maxRate) where.dayRate[Op.lte] = maxRate; }

    const offset = (page - 1) * limit;
    const { count, rows } = await OperatorProfile.findAndCountAll({
      where, include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [[sortBy, sortOrder]], limit: parseInt(limit), offset,
    });
    res.json({ operators: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit), limit: parseInt(limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOperator = async (req, res) => {
  try {
    const profile = await OperatorProfile.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone', 'city', 'state'] }],
    });
    if (!profile) return res.status(404).json({ message: 'Operator not found' });
    await profile.increment('profileViews');
    res.json({ operator: profile });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await OperatorProfile.findOne({ where: { userId: req.userId } });
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
