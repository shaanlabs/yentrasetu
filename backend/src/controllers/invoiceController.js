/**
 * GST Invoice Generator
 * Generates structured GST-compliant invoice data for bookings and subscriptions.
 * For demo: returns JSON invoice data. In production, this would render a PDF via puppeteer/pdfkit.
 */
const { RentalBooking, MachineryListing, User, Subscription } = require('../models');

const PLATFORM = {
  name: 'YantraSetu Technologies Pvt. Ltd.',
  gstin: '29AABCY1234F1Z5', // Demo GSTIN
  pan: 'AABCY1234F',
  address: '4th Floor, Brigade Gateway, Rajajinagar, Bangalore, Karnataka - 560010',
  state: 'Karnataka',
  stateCode: '29',
  sacCode: '996729', // SAC for rental/leasing of machinery
  email: 'billing@yantrasetu.com',
  phone: '+91-80-4567-8900',
};

function generateInvoiceNumber(prefix, id) {
  const date = new Date();
  const fy = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const seq = id.substring(0, 8).toUpperCase();
  return `${prefix}/${fy}-${fy + 1}/${seq}`;
}

function calculateGST(amount, buyerState) {
  const rate = 0.18; // 18% GST
  const totalTax = amount * rate;
  const isSameState = buyerState?.toLowerCase() === PLATFORM.state.toLowerCase();

  if (isSameState) {
    return {
      cgst: { rate: 9, amount: totalTax / 2 },
      sgst: { rate: 9, amount: totalTax / 2 },
      igst: null,
      totalTax,
    };
  } else {
    return {
      cgst: null,
      sgst: null,
      igst: { rate: 18, amount: totalTax },
      totalTax,
    };
  }
}

exports.generateBookingInvoice = async (req, res) => {
  try {
    const booking = await RentalBooking.findByPk(req.params.bookingId, {
      include: [
        { model: MachineryListing, as: 'listing', attributes: ['make', 'model', 'category', 'city', 'state'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'companyName', 'gstNumber', 'address', 'city', 'state', 'phone', 'email'] },
        { model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName', 'companyName', 'gstNumber', 'address', 'city', 'state', 'phone', 'email'] },
      ]
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.ownerId !== req.userId && booking.renterId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    const rentalAmount = parseFloat(booking.totalRentalAmount) || 0;
    const depositAmount = parseFloat(booking.securityDeposit) || 0;
    const commissionAmount = parseFloat(booking.platformCommission) || 0;
    const renterState = booking.renter?.state;

    const gst = calculateGST(commissionAmount, renterState);

    const invoice = {
      invoiceNumber: generateInvoiceNumber('YS/BK', booking.id),
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: booking.startDate,
      type: 'RENTAL_BOOKING',

      // Seller (platform)
      seller: PLATFORM,

      // Buyer
      buyer: {
        name: booking.renter?.companyName || `${booking.renter?.firstName} ${booking.renter?.lastName}`,
        gstin: booking.renter?.gstNumber || 'Unregistered',
        address: booking.renter?.address || '',
        city: booking.renter?.city || '',
        state: booking.renter?.state || '',
        phone: booking.renter?.phone || '',
        email: booking.renter?.email || '',
      },

      // Equipment owner
      equipmentOwner: {
        name: booking.owner?.companyName || `${booking.owner?.firstName} ${booking.owner?.lastName}`,
        gstin: booking.owner?.gstNumber || 'Unregistered',
        city: booking.owner?.city || '',
        state: booking.owner?.state || '',
      },

      // Line items
      items: [
        {
          description: `Rental: ${booking.listing?.make} ${booking.listing?.model} (${booking.listing?.category})`,
          sacCode: PLATFORM.sacCode,
          period: `${booking.startDate} to ${booking.endDate}`,
          duration: `${booking.duration} days`,
          rate: parseFloat(booking.rentalRate),
          quantity: booking.duration,
          amount: rentalAmount,
        },
        {
          description: 'Platform Service Fee (10%)',
          sacCode: '998599',
          amount: commissionAmount,
        },
        {
          description: 'Refundable Security Deposit',
          sacCode: null,
          amount: depositAmount,
          isDeposit: true,
        },
      ],

      // Tax breakdown
      taxableValue: commissionAmount,
      gst,

      // Totals
      subtotal: rentalAmount + commissionAmount,
      totalTax: gst.totalTax,
      securityDeposit: depositAmount,
      grandTotal: rentalAmount + commissionAmount + gst.totalTax + depositAmount,

      // Metadata
      bookingId: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      notes: [
        'Security deposit is refundable upon completion of the rental period.',
        'GST charged on platform service fee only.',
        'Equipment rental amount is payable directly to the equipment owner.',
        'This is a computer-generated invoice and does not require a signature.',
      ],

      // Terms
      terms: [
        'Payment is due before the rental start date.',
        'Cancellation within 24 hours of booking: Full refund.',
        'Cancellation after 24 hours: 20% cancellation fee.',
        'Equipment must be returned in the same condition.',
        'Any damages will be deducted from the security deposit.',
      ],
    };

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.generateSubscriptionInvoice = async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.subscriptionId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'companyName', 'gstNumber', 'address', 'city', 'state', 'phone', 'email'] }]
    });

    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    if (subscription.userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const amount = parseFloat(subscription.amount) || 0;
    const buyerState = subscription.user?.state;
    const gst = calculateGST(amount, buyerState);

    const planNames = { free: 'Free', starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' };

    const invoice = {
      invoiceNumber: generateInvoiceNumber('YS/SUB', subscription.id),
      invoiceDate: new Date(subscription.startDate).toISOString().split('T')[0],
      type: 'SUBSCRIPTION',

      seller: PLATFORM,

      buyer: {
        name: subscription.user?.companyName || `${subscription.user?.firstName} ${subscription.user?.lastName}`,
        gstin: subscription.user?.gstNumber || 'Unregistered',
        address: subscription.user?.address || '',
        city: subscription.user?.city || '',
        state: subscription.user?.state || '',
        phone: subscription.user?.phone || '',
        email: subscription.user?.email || '',
      },

      items: [
        {
          description: `YantraSetu ${planNames[subscription.plan] || subscription.plan} Plan — Monthly Subscription`,
          sacCode: '998431', // SAC for licensing services
          period: `${new Date(subscription.startDate).toISOString().split('T')[0]} to ${new Date(subscription.endDate).toISOString().split('T')[0]}`,
          quantity: 1,
          rate: amount,
          amount,
        },
      ],

      taxableValue: amount,
      gst,
      subtotal: amount,
      totalTax: gst.totalTax,
      grandTotal: amount + gst.totalTax,

      subscriptionId: subscription.id,
      plan: subscription.plan,
      status: subscription.status,

      notes: [
        'This is a computer-generated invoice and does not require a signature.',
        'For any billing queries, contact billing@yantrasetu.com.',
      ],
    };

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Subscription invoice error:', err);
    res.status(500).json({ message: err.message });
  }
};
