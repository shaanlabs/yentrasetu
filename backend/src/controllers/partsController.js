const { PartListing, User } = require('../models');
const { Op } = require('sequelize');
const { iLikeFilter } = require('../config/dbHelpers');
const { parsePagination } = require('../config/pagination');

exports.createPart = async (req, res) => {
  try {
    const allowed = ['partName', 'partNumber', 'oemPartNumber', 'category', 'condition', 'compatibleMakes', 'compatibleModels', 'price', 'quantity', 'description', 'images', 'city', 'state', 'warranty'];
    const data = { userId: req.userId };
    allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    const part = await PartListing.create(data);
    res.status(201).json({ message: 'Part listed successfully', part });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getParts = async (req, res) => {
  try {
    const { 
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
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (state) where.state = { [Op.like]: `%${state}%` };
    
    if (minPrice || maxPrice) { 
      where.price = {}; 
      if (minPrice) where.price[Op.gte] = minPrice; 
      if (maxPrice) where.price[Op.lte] = maxPrice; 
    }

    if (query) {
      where[Op.or] = [
        { partName: iLikeFilter(query) },
        { partNumber: iLikeFilter(query) },
        { oemPartNumber: iLikeFilter(query) },
        { compatibleMakes: iLikeFilter(query) }
      ];
    }

    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await PartListing.findAndCountAll({
      where, attributes: { exclude: ['images'] },
      include: [{ model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [[sortBy, sortOrder]], limit, offset, 
    });
    res.json({ parts: rows, pagination: { total: count, page, pages: Math.ceil(count / limit), limit } });
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
    const part = await PartListing.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!part) return res.status(404).json({ message: 'Part not found' });
    await part.destroy();
    res.json({ message: 'Part deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyParts = async (req, res) => {
  try {
    const parts = await PartListing.findAll({ where: { userId: req.userId }, order: [['createdAt', 'DESC']] });
    res.json({ parts });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
