const { User, MachineryListing } = require('../models');
const FraudReport = require('../models/FraudReport');
const { Op } = require('sequelize');

// Submit a fraud report
exports.submitReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description, evidenceImages } = req.body;

    if (!targetType || !targetId || !reason || !description) {
      return res.status(400).json({ message: 'targetType, targetId, reason, and description are required.' });
    }

    // Prevent duplicate pending reports from the same user on the same target
    const existing = await FraudReport.findOne({
      where: { reporterId: req.userId, targetType, targetId, status: { [Op.in]: ['pending', 'investigating'] } }
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have an open report on this item.' });
    }

    // Verify the target exists
    if (targetType === 'listing') {
      const listing = await MachineryListing.findByPk(targetId);
      if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    } else if (targetType === 'user') {
      const user = await User.findByPk(targetId);
      if (!user) return res.status(404).json({ message: 'User not found.' });
    }

    const report = await FraudReport.create({
      reporterId: req.userId,
      targetType,
      targetId,
      reason,
      description,
      evidenceImages: evidenceImages || []
    });

    res.status(201).json({ message: 'Fraud report submitted. Our team will investigate.', report });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get current user's fraud reports
exports.getMyReports = async (req, res) => {
  try {
    const reports = await FraudReport.findAll({
      where: { reporterId: req.userId },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['evidenceImages'] }
    });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get all pending/investigating fraud reports
exports.getPendingReports = async (req, res) => {
  try {
    const reports = await FraudReport.findAll({
      where: { status: { [Op.in]: ['pending', 'investigating'] } },
      include: [{ model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Review a fraud report (investigate, resolve, dismiss)
exports.reviewReport = async (req, res) => {
  try {
    const { status, adminNotes, resolution } = req.body;
    if (!['investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "investigating", "resolved", or "dismissed".' });
    }

    const report = await FraudReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    await report.update({
      status,
      adminNotes,
      resolution: resolution || null,
      reviewedBy: req.userId,
      reviewedAt: new Date()
    });

    // Auto-ban: if resolved and target is a user, check if ≥3 resolved reports exist for that target
    if (status === 'resolved' && report.targetType === 'user') {
      const resolvedCount = await FraudReport.count({
        where: { targetType: 'user', targetId: report.targetId, status: 'resolved' }
      });
      if (resolvedCount >= 3) {
        await User.update(
          { isBanned: true, banReason: 'Auto-banned: 3+ upheld fraud reports.' },
          { where: { id: report.targetId } }
        );
        return res.json({ message: `Report ${status}. User auto-banned (${resolvedCount} upheld reports).`, report });
      }
    }

    // If resolved and target is a listing, mark listing as rejected
    if (status === 'resolved' && report.targetType === 'listing') {
      await MachineryListing.update(
        { status: 'rejected', rejectionReason: `Fraud report upheld: ${report.reason}` },
        { where: { id: report.targetId } }
      );
    }

    res.json({ message: `Report ${status}.`, report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
