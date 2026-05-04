const { Subscription, Transaction, User } = require('../models');
const crypto = require('crypto');

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxListings: 5,
    featuredListings: 0,
    photosPerListing: 3,
    description: 'Get started with basic listings and explore the platform at no cost.',
    features: [
      { name: '5 Active Listings', detail: 'List up to 5 machines for sale or rent at a time' },
      { name: '3 Photos per Listing', detail: 'Upload up to 3 images per machinery listing' },
      { name: 'Standard Support', detail: 'Email support with response within 48 business hours' },
      { name: 'Basic Search Visibility', detail: 'Appear in standard search results' },
      { name: 'Buyer Messaging', detail: 'Receive and respond to buyer inquiries via in-app chat' },
    ]
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 2999,
    maxListings: 20,
    featuredListings: 2,
    photosPerListing: 10,
    description: 'Ideal for small dealers looking to expand reach and generate more leads.',
    features: [
      { name: '20 Active Listings', detail: 'List up to 20 machines for sale or rent simultaneously' },
      { name: '10 Photos per Listing', detail: 'Showcase machinery with up to 10 high-quality images' },
      { name: '2 Featured Listings', detail: 'Pin 2 listings at the top of search results for more visibility' },
      { name: 'Priority Support', detail: 'Email & chat support with response within 24 hours' },
      { name: 'Enhanced Search Visibility', detail: 'Boosted ranking in search results across categories' },
      { name: 'Verified Seller Badge', detail: 'Display a trust badge on your profile and listings' },
      { name: 'Basic Analytics', detail: 'View counts, inquiry stats, and listing performance data' },
    ]
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 9999,
    maxListings: 100,
    featuredListings: 10,
    photosPerListing: 20,
    description: 'For growing businesses needing AI insights, dedicated support, and top visibility.',
    features: [
      { name: '100 Active Listings', detail: 'Scale your inventory with up to 100 simultaneous listings' },
      { name: '20 Photos per Listing', detail: 'Full photo galleries with up to 20 images per listing' },
      { name: '10 Featured Listings', detail: 'Premium placement on browse pages, search, and homepage' },
      { name: 'Dedicated Account Manager', detail: 'A personal YantraSetu manager to help grow your business' },
      { name: 'Verified Badge', detail: 'Prominent verified seller trust mark across all pages' },
      { name: 'Priority Search', detail: 'Top-tier search positioning across all Indian regions' },
      { name: 'AI Price Intelligence', detail: 'AI-powered pricing recommendations based on market data' },
      { name: 'Demand Forecasting', detail: 'Predict demand trends for machinery categories in your area' },
      { name: 'Advanced Analytics', detail: 'Market trends, competitor analysis, and ROI tracking' },
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 19999,
    maxListings: -1,
    featuredListings: 50,
    photosPerListing: 50,
    description: 'Full-scale solution for large dealers with API access, bulk tools, and custom analytics.',
    features: [
      { name: 'Unlimited Listings', detail: 'No cap on the number of active listings at any time' },
      { name: '50 Photos per Listing', detail: 'Comprehensive media galleries for every machine' },
      { name: '50 Featured Listings', detail: 'Maximum visibility with 50 pinned listings platform-wide' },
      { name: 'Bulk Upload Support', detail: 'Import listings via CSV/Excel for rapid inventory onboarding' },
      { name: 'Full API Access', detail: 'REST API for programmatic listing management and integrations' },
      { name: 'Custom Analytics Dashboard', detail: 'Build custom reports, export data, and track KPIs' },
      { name: 'AI Suite (Full Access)', detail: 'Price intelligence, demand forecasting, SEO scoring, and health reports' },
      { name: 'Multi-user Access', detail: 'Add team members with role-based permissions and controls' },
      { name: 'White-glove Onboarding', detail: 'Dedicated team to migrate and set up your account' },
      { name: 'Invoice & GST Integration', detail: 'Auto-generate GST-compliant invoices for every transaction' },
    ]
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
