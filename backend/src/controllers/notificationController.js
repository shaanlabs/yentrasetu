const { Notification } = require('../models');
const { Op } = require('sequelize');

/**
 * Helper: Create a notification for a user.
 * Called internally from other controllers.
 */
exports.createNotification = async ({ userId, type, title, body, data }) => {
  try {
    return await Notification.create({ userId, type, title, body: body || '', data: data || {} });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

/**
 * GET /notifications — paginated, unread-first
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      order: [['isRead', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      notifications: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /notifications/:id/read — mark single as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    await notification.update({ isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /notifications/read-all — mark all as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
