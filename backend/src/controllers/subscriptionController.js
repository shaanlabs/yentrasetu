const { Subscription, Transaction, User } = require('../models');
const crypto = require('crypto');

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxListings: 5,
    featuredListings: 0,
    features: ['5 Listings', 'Standard Support', 'Basic Search Visibility']
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 2999,
    maxListings: 20,
    featuredListings: 2,
    features: ['20 Listings', 'Priority Support', 'Enhanced Search Visibility', '2 Featured Listings']
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 9999,
    maxListings: 100,
    featuredListings: 10,
    features: ['100 Listings', 'Dedicated Account Manager', 'Verified Badge', '10 Featured Listings', 'Priority Search']
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 19999,
    maxListings: -1,
    featuredListings: 50,
    features: ['Unlimited Listings', 'Bulk Upload Support', 'API Access', 'Custom Analytics', '50 Featured Listings']
  }
};

const GST_RATE = 0.18; // 18% GST

function generateOrderId() {
  return 'YS_ORD_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function generateTxnId() {
  return 'YS_TXN_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// ─── Get Plans ─────────────────────────────────────────
exports.getPlans = async (req, res) => {
  try {
    const plansWithGst = Object.values(PLANS).map(p => ({
      ...p,
      gstAmount: Math.round(p.price * GST_RATE),
      totalAmount: p.price + Math.round(p.price * GST_RATE),
    }));
    res.json({ success: true, plans: plansWithGst });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Initiate Payment (creates pending order) ──────────
exports.initiatePayment = async (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' });
    if (plan.price === 0) return res.status(400).json({ success: false, message: 'Free plan does not require payment' });

    const validMethods = ['upi', 'card', 'netbanking'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const user = await User.findByPk(req.userId);
    const baseAmount = plan.price;
    const gstAmount = Math.round(baseAmount * GST_RATE);
    const totalAmount = baseAmount + gstAmount;
    const orderId = generateOrderId();

    // Create pending transaction
    const transaction = await Transaction.create({
      userId: user.id,
      transactionType: 'subscription',
      relatedType: 'subscription',
      amount: totalAmount,
      currency: 'INR',
      paymentMethod,
      paymentGateway: 'demo_gateway',
      gatewayTransactionId: orderId,
      status: 'pending',
      description: `${plan.name} Plan Subscription (30 days)`,
      metadata: {
        planId,
        planName: plan.name,
        baseAmount,
        gstAmount,
        gstRate: GST_RATE * 100,
        totalAmount,
        orderId,
      }
    });

    // Build demo payment response
    const paymentResponse = {
      orderId,
      transactionId: transaction.id,
      amount: totalAmount,
      currency: 'INR',
      planName: plan.name,
      baseAmount,
      gstAmount,
      paymentMethod,
      status: 'created',
    };

    // Add method-specific demo data
    if (paymentMethod === 'upi') {
      paymentResponse.upiDeepLink = `upi://pay?pa=yantrasetu@ybl&pn=YantraSetu&am=${totalAmount}&cu=INR&tn=${orderId}`;
      paymentResponse.upiId = 'yantrasetu@ybl';
      paymentResponse.qrData = `upi://pay?pa=yantrasetu@ybl&pn=YantraSetu&am=${totalAmount}&cu=INR&tn=${orderId}`;
    } else if (paymentMethod === 'netbanking') {
      paymentResponse.banks = [
        { code: 'SBI', name: 'State Bank of India', icon: '🏦' },
        { code: 'HDFC', name: 'HDFC Bank', icon: '🏛️' },
        { code: 'ICICI', name: 'ICICI Bank', icon: '🏢' },
        { code: 'AXIS', name: 'Axis Bank', icon: '🏗️' },
        { code: 'PNB', name: 'Punjab National Bank', icon: '🏦' },
        { code: 'BOB', name: 'Bank of Baroda', icon: '🏛️' },
        { code: 'KOTAK', name: 'Kotak Mahindra Bank', icon: '🏢' },
        { code: 'YES', name: 'YES Bank', icon: '🏗️' },
      ];
    }

    res.json({ success: true, payment: paymentResponse });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Verify / Complete Payment (demo) ─────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body;

    // Find the pending transaction
    const transaction = await Transaction.findOne({
      where: { gatewayTransactionId: orderId, status: 'pending' }
    });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Order not found or already processed' });
    }

    const meta = transaction.metadata || {};
    const planId = meta.planId;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan in order' });

    const user = await User.findByPk(transaction.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Simulate payment verification (in production, verify with Razorpay/Stripe)
    const demoTxnId = generateTxnId();

    // Mark transaction as completed
    await transaction.update({
      status: 'completed',
      completedAt: new Date(),
      metadata: {
        ...meta,
        gatewayTxnId: demoTxnId,
        paymentDetails: paymentDetails || {},
        verifiedAt: new Date().toISOString(),
      }
    });

    // Cancel existing active subscription if any
    await Subscription.update(
      { status: 'expired' },
      { where: { userId: user.id, status: 'active' } }
    );

    // Create new subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const subscription = await Subscription.create({
      userId: user.id,
      plan: planId,
      status: 'active',
      startDate: new Date(),
      endDate,
      maxListings: plan.maxListings,
      featuredListings: plan.featuredListings,
      amount: plan.price,
      metadata: {
        transactionId: transaction.id,
        orderId,
        paymentMethod,
        gatewayTxnId: demoTxnId,
      }
    });

    // Update user tier
    await user.update({
      accountTier: planId,
      subscriptionExpiry: endDate,
    });

    // Build receipt
    const receipt = {
      receiptNo: 'YS-INV-' + Date.now(),
      orderId,
      transactionId: demoTxnId,
      planName: plan.name,
      baseAmount: meta.baseAmount,
      gstAmount: meta.gstAmount,
      gstRate: '18%',
      totalAmount: meta.totalAmount,
      currency: 'INR',
      paymentMethod,
      paidAt: new Date().toISOString(),
      validUntil: endDate.toISOString(),
      customerName: user.getFullName(),
      customerPhone: user.phone,
      customerEmail: user.email,
    };

    res.json({
      success: true,
      message: `Payment successful! Subscribed to ${plan.name} plan.`,
      subscription,
      receipt,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Transaction History ──────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Legacy subscribe (kept for backward compat) ──────
exports.subscribe = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const user = await User.findByPk(req.userId);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const subscription = await Subscription.create({
      userId: user.id,
      plan: planId,
      status: 'active',
      startDate: new Date(),
      endDate,
      maxListings: plan.maxListings,
      featuredListings: plan.featuredListings,
      amount: plan.price
    });

    await user.update({
      accountTier: planId,
      subscriptionExpiry: endDate
    });

    res.json({ success: true, subscription, message: `Successfully subscribed to ${plan.name} plan!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get My Subscription ─────────────────────────────
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.userId, status: 'active' },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Cancel Subscription ─────────────────────────────
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.userId, status: 'active' }
    });
    if (!subscription) return res.status(404).json({ success: false, message: 'No active subscription found' });

    await subscription.update({ status: 'cancelled' });
    await User.update({ accountTier: 'free' }, { where: { id: req.userId } });

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
