const { RentalBooking, MachineryListing, User } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('./notificationController');

// ─── Booking State Machine ────────────────────────────
// Defines allowed transitions and who can trigger them
const TRANSITIONS = {
  pending:   { confirmed: 'owner', cancelled: 'both' },
  confirmed: { active: 'owner', cancelled: 'both' },
  active:    { completed: 'owner', cancelled: 'both', disputed: 'both' },
  // Terminal states — no transitions out
  completed: {},
  cancelled: {},
  disputed:  { resolved: 'admin' },
};

function canTransition(currentStatus, newStatus, userId, booking) {
  const allowed = TRANSITIONS[currentStatus];
  if (!allowed || !allowed[newStatus]) return { ok: false, reason: `Cannot move from "${currentStatus}" to "${newStatus}".` };

  const role = allowed[newStatus];
  if (role === 'owner' && userId !== booking.ownerId) return { ok: false, reason: 'Only the equipment owner can perform this action.' };
  if (role === 'renter' && userId !== booking.renterId) return { ok: false, reason: 'Only the renter can perform this action.' };
  // 'both' = either party is allowed
  if (role === 'both' && userId !== booking.ownerId && userId !== booking.renterId) return { ok: false, reason: 'Not authorized.' };

  return { ok: true };
}

exports.createBooking = async (req, res) => {
  try {
    const listing = await MachineryListing.findByPk(req.body.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.listingType !== 'rent') return res.status(400).json({ message: 'Listing is not for rent' });
    if (listing.userId === req.userId) return res.status(400).json({ message: 'Cannot book your own listing' });

    const { startDate, endDate, withOperator, renterNotes } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ─── Date validation ───────────────────────────────
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    if (start < today) {
      return res.status(400).json({ message: 'Start date cannot be in the past.' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after the start date.' });
    }

    // ─── Double-booking prevention ─────────────────────
    const overlapping = await RentalBooking.findOne({
      where: {
        listingId: listing.id,
        status: { [Op.notIn]: ['cancelled', 'completed', 'disputed'] },
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
      }
    });
    if (overlapping) {
      return res.status(409).json({
        message: `This machine is already booked from ${overlapping.startDate} to ${overlapping.endDate}. Please choose different dates.`,
        conflictingBooking: {
          startDate: overlapping.startDate,
          endDate: overlapping.endDate,
        }
      });
    }

    // ─── Calculate pricing ─────────────────────────────
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const rate = listing.rentalRateDaily || listing.price;
    const total = rate * days;
    const deposit = total * 0.2;
    const commission = total * 0.1;

    const booking = await RentalBooking.create({
      listingId: listing.id, ownerId: listing.userId, renterId: req.userId,
      startDate, endDate, duration: days, rentalRate: rate, rentalUnit: 'daily',
      totalRentalAmount: total, securityDeposit: deposit, platformCommission: commission,
      commissionPercentage: 10, totalAmount: total + deposit + commission,
      withOperator: !!withOperator, renterNotes,
    });

    // Notify the listing owner about the new booking
    const renter = await User.findByPk(req.userId, { attributes: ['firstName', 'lastName'] });
    createNotification({
      userId: listing.userId,
      type: 'booking_created',
      title: 'New Booking Request',
      body: `${renter?.firstName || 'Someone'} wants to rent your ${listing.make} ${listing.model} for ${days} days (${startDate} to ${endDate}).`,
      data: { bookingId: booking.id, listingId: listing.id },
    });

    res.status(201).json({ message: 'Booking created', booking });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { role = 'renter' } = req.query;
    const where = role === 'owner' ? { ownerId: req.userId } : { renterId: req.userId };
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

    // Authorization check
    if (booking.ownerId !== req.userId && booking.renterId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, reason } = req.body;

    // ─── State machine validation ──────────────────────
    const check = canTransition(booking.status, status, req.userId, booking);
    if (!check.ok) {
      return res.status(400).json({ message: check.reason });
    }

    // Handle cancellation metadata
    if (status === 'cancelled') {
      booking.cancelledBy = req.userId;
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason || null;
    }

    booking.status = status;
    await booking.save();

    // Notify the other party
    const notifyUserId = req.userId === booking.ownerId ? booking.renterId : booking.ownerId;
    const statusLabels = {
      confirmed: 'Booking Confirmed ✅',
      cancelled: 'Booking Cancelled ❌',
      active: 'Booking Active — Equipment Handed Over',
      completed: 'Booking Completed ✅',
      disputed: 'Booking Disputed ⚠️',
    };
    createNotification({
      userId: notifyUserId,
      type: `booking_${status}`,
      title: statusLabels[status] || 'Booking Updated',
      body: `Your booking has been ${status}.${reason ? ' Reason: ' + reason : ''}`,
      data: { bookingId: booking.id },
    });

    res.json({ message: 'Booking updated', booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get available dates for a listing (for calendar UI)
exports.getAvailability = async (req, res) => {
  try {
    const { listingId } = req.params;
    const bookings = await RentalBooking.findAll({
      where: {
        listingId,
        status: { [Op.notIn]: ['cancelled', 'completed'] },
        endDate: { [Op.gte]: new Date() },
      },
      attributes: ['startDate', 'endDate', 'status'],
      order: [['startDate', 'ASC']],
    });
    res.json({ bookedPeriods: bookings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
