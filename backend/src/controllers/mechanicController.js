const { MechanicProfile, User } = require('../models');
const { Op } = require('sequelize');

exports.createOrUpdateProfile = async (req, res) => {
  try {
    const [profile, created] = await MechanicProfile.findOrCreate({
      where: { userId: req.user.id }, defaults: { ...req.body, userId: req.user.id },
    });
    if (!created) { await profile.update(req.body); }
    res.status(created ? 201 : 200).json({ message: created ? 'Profile created' : 'Profile updated', profile });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getMechanics = async (req, res) => {
  try {
    const { page = 1, limit = 12, city, state, specialization, minRate, maxRate, isAvailable, sortBy = 'rating', sortOrder = 'DESC' } = req.query;
    const where = { isActive: true };
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (state) where.state = { [Op.like]: `%${state}%` };
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (minRate || maxRate) { where.hourlyRate = {}; if (minRate) where.hourlyRate[Op.gte] = minRate; if (maxRate) where.hourlyRate[Op.lte] = maxRate; }

    const offset = (page - 1) * limit;
    const { count, rows } = await MechanicProfile.findAndCountAll({
      where, include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [[sortBy, sortOrder]], limit: parseInt(limit), offset,
    });
    res.json({ mechanics: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit), limit: parseInt(limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMechanic = async (req, res) => {
  try {
    const profile = await MechanicProfile.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone', 'city', 'state'] }],
    });
    if (!profile) return res.status(404).json({ message: 'Mechanic not found' });
    await profile.increment('profileViews');
    res.json({ mechanic: profile });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await MechanicProfile.findOne({ where: { userId: req.user.id } });
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
