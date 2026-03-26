const { User, MachineryListing, PartListing, OperatorProfile, MechanicProfile, RentalBooking, Review } = require('../models');

exports.getDashboard = async (req, res) => {
  try {
    const [users, listings, parts, operators, mechanics, bookings, reviews] = await Promise.all([
      User.count(), MachineryListing.count(), PartListing.count(),
      OperatorProfile.count(), MechanicProfile.count(), RentalBooking.count(), Review.count(),
    ]);
    const pendingListings = await MachineryListing.count({ where: { status: 'pending' } });
    res.json({ stats: { users, listings, parts, operators, mechanics, bookings, reviews, pendingListings } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPendingListings = async (req, res) => {
  try {
    const listings = await MachineryListing.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [['createdAt', 'ASC']],
    });
    res.json({ listings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.approveListing = async (req, res) => {
  try {
    const listing = await MachineryListing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    await listing.update({ status: 'approved' });
    res.json({ message: 'Listing approved', listing });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.rejectListing = async (req, res) => {
  try {
    const listing = await MachineryListing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    await listing.update({ status: 'rejected' });
    res.json({ message: 'Listing rejected', listing });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json({ users });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
