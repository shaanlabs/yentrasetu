const { User } = require('../models');
const CertificationRequest = require('../models/CertificationRequest');

// Submit a certification for verification
exports.submitCertification = async (req, res) => {
  try {
    const { certificationType, documentName, documentNumber, documentImage, issuingAuthority, issuedDate, expiresAt } = req.body;

    if (!certificationType || !documentName || !documentImage) {
      return res.status(400).json({ message: 'certificationType, documentName, and documentImage are required.' });
    }

    const cert = await CertificationRequest.create({
      userId: req.userId,
      certificationType,
      documentName,
      documentNumber,
      documentImage,
      issuingAuthority,
      issuedDate,
      expiresAt
    });

    res.status(201).json({ message: 'Certification submitted for verification.', certification: cert });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get current user's certifications
exports.getMyCertifications = async (req, res) => {
  try {
    const certs = await CertificationRequest.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['documentImage'] }
    });
    res.json({ certifications: certs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single certification (with document image for review)
exports.getCertification = async (req, res) => {
  try {
    const cert = await CertificationRequest.findByPk(req.params.id, {
      include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'phone', 'userType'] }]
    });
    if (!cert) return res.status(404).json({ message: 'Certification not found.' });

    // Only owner or admin can view full details
    const isAdmin = req.user.userType === 'admin' || req.user.userType === 'super_admin';
    if (cert.userId !== req.userId && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ certification: cert });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get all pending certification requests
exports.getPendingCertifications = async (req, res) => {
  try {
    const certs = await CertificationRequest.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'phone', 'userType'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json({ certifications: certs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Approve or reject a certification
exports.reviewCertification = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "rejected".' });
    }

    const cert = await CertificationRequest.findByPk(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certification not found.' });

    await cert.update({
      status,
      adminNotes,
      reviewedBy: req.userId,
      reviewedAt: new Date()
    });

    // If approved, mark the user as verified
    if (status === 'approved') {
      await User.update({ isVerified: true }, { where: { id: cert.userId } });
    }

    res.json({ message: `Certification ${status}.`, certification: cert });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
