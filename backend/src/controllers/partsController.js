const { PartListing, User } = require('../models');
const { Op } = require('sequelize');

exports.createPart = async (req, res) => {
  try {
    const part = await PartListing.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ message: 'Part listed successfully', part });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getParts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      condition, 
      minPrice, 
      maxPrice, 
      city, 
      state, 
      query,
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;

    const where = { status: 'active', isActive: true };
    
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = { [Op.iLike]: `%${state}%` };
    
    if (minPrice || maxPrice) { 
      where.price = {}; 
      if (minPrice) where.price[Op.gte] = minPrice; 
      if (maxPrice) where.price[Op.lte] = maxPrice; 
    }

    if (query) {
      where[Op.or] = [
        { partName: { [Op.iLike]: `%${query}%` } },
        { partNumber: { [Op.iLike]: `%${query}%` } },
        { oemPartNumber: { [Op.iLike]: `%${query}%` } },
        { compatibleMakes: { [Op.iLike]: `%${query}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await PartListing.findAndCountAll({
      where, include: [{ model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [[sortBy, sortOrder]], limit: parseInt(limit), offset, 
    });
    res.json({ parts: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit), limit: parseInt(limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPart = async (req, res) => {
  try {
    const part = await PartListing.findByPk(req.params.id, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'phone', 'city', 'state'] }],
    });
    if (!part) return res.status(404).json({ message: 'Part not found' });
    await part.increment('viewCount');
    res.json({ part });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deletePart = async (req, res) => {
  try {
    const part = await PartListing.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!part) return res.status(404).json({ message: 'Part not found' });
    await part.destroy();
    res.json({ message: 'Part deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyParts = async (req, res) => {
  try {
    const parts = await PartListing.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ parts });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
