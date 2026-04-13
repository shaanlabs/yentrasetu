const { RentalBooking, MachineryListing, User } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('./notificationController');

exports.createBooking = async (req, res) => {
  try {
    const listing = await MachineryListing.findByPk(req.body.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.listingType !== 'rent') return res.status(400).json({ message: 'Listing is not for rent' });
    if (listing.userId === req.user.id) return res.status(400).json({ message: 'Cannot book your own listing' });

    const { startDate, endDate, withOperator, renterNotes } = req.body;
    const start = new Date(startDate); const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const rate = listing.rentalRateDaily || listing.price;
    const total = rate * days;
    const deposit = total * 0.2; const commission = total * 0.1;

    const booking = await RentalBooking.create({
      listingId: listing.id, ownerId: listing.userId, renterId: req.user.id,
      startDate, endDate, duration: days, rentalRate: rate, rentalUnit: 'daily',
      totalRentalAmount: total, securityDeposit: deposit, platformCommission: commission,
      commissionPercentage: 10, totalAmount: total + deposit + commission,
      withOperator: !!withOperator, renterNotes,
    });

    // Notify the listing owner about the new booking
    const renter = await User.findByPk(req.user.id, { attributes: ['firstName', 'lastName'] });
    createNotification({
      userId: listing.userId,
      type: 'booking_created',
      title: 'New Booking Request',
      body: `${renter?.firstName || 'Someone'} wants to rent your ${listing.make} ${listing.model} for ${days} days.`,
      data: { bookingId: booking.id, listingId: listing.id },
    });

    res.status(201).json({ message: 'Booking created', booking });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { role = 'renter' } = req.query;
    const where = role === 'owner' ? { ownerId: req.user.id } : { renterId: req.user.id };
    const bookings = await RentalBooking.findAll({
      where, include: [
        { model: MachineryListing, as: 'listing', attributes: ['id', 'make', 'model', 'images', 'price'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName', 'phone'] },
      ], order: [['createdAt', 'DESC']],
    });
    res.json({ bookings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await RentalBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.ownerId !== req.user.id && booking.renterId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    const { status } = req.body;
    const allowed = ['confirmed', 'active', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if (status === 'cancelled') { booking.cancelledBy = req.user.id; booking.cancelledAt = new Date(); booking.cancellationReason = req.body.reason; }
    booking.status = status;
    await booking.save();

    // Notify the other party
    const notifyUserId = req.user.id === booking.ownerId ? booking.renterId : booking.ownerId;
    const statusLabels = { confirmed: 'Booking Confirmed', cancelled: 'Booking Cancelled', active: 'Booking Active', completed: 'Booking Completed' };
    createNotification({
      userId: notifyUserId,
      type: `booking_${status}`,
      title: statusLabels[status] || 'Booking Updated',
      body: `Your booking has been ${status}.`,
      data: { bookingId: booking.id },
    });

    res.json({ message: 'Booking updated', booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
