const { Chat, Message, User } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('./notificationController');

exports.startOrGetChat = async (req, res) => {
  try {
    const { sellerId, listingType, listingId } = req.body;
    if (req.userId === sellerId) return res.status(400).json({ message: 'Cannot chat with yourself' });
    let chat = await Chat.findOne({ where: { buyerId: req.userId, sellerId, listingId: listingId || null } });
    if (!chat) chat = await Chat.create({ buyerId: req.userId, sellerId, listingType, listingId });
    res.json({ chat });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.findAll({
      where: { [Op.or]: [{ buyerId: req.userId }, { sellerId: req.userId }], status: 'active' },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName'] },
      ], order: [['lastMessageAt', 'DESC']],
    });
    res.json({ chats });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMessages = async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (chat.buyerId !== req.userId && chat.sellerId !== req.userId) return res.status(403).json({ message: 'Not authorized' });

    // ─── Pagination support ───────────────────────────
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { chatId: chat.id, isDeleted: false },
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']], // Newest first for pagination
      limit,
      offset,
    });

    // Mark as read
    const unreadField = chat.buyerId === req.userId ? 'buyerUnreadCount' : 'sellerUnreadCount';
    await chat.update({ [unreadField]: 0 });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      chat,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        hasMore: page * limit < count,
      },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (chat.buyerId !== req.userId && chat.sellerId !== req.userId) return res.status(403).json({ message: 'Not authorized' });
    const msg = await Message.create({ chatId: chat.id, senderId: req.userId, content: req.body.content, messageType: req.body.messageType || 'text' });
    const unreadField = chat.buyerId === req.userId ? 'sellerUnreadCount' : 'buyerUnreadCount';
    await chat.update({ lastMessageAt: new Date(), lastMessagePreview: req.body.content.substring(0, 200), [unreadField]: chat[unreadField] + 1 });
    const message = await Message.findByPk(msg.id, { include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }] });

    // Notify the other person in the chat
    const recipientId = chat.buyerId === req.userId ? chat.sellerId : chat.buyerId;
    const sender = await User.findByPk(req.userId, { attributes: ['firstName', 'lastName'] });
    createNotification({
      userId: recipientId,
      type: 'message_received',
      title: 'New Message',
      body: `${sender?.firstName || 'Someone'}: ${req.body.content.substring(0, 100)}`,
      data: { chatId: chat.id },
    });

    res.status(201).json({ message: message });
  } catch (err) { res.status(400).json({ message: err.message }); }
};
