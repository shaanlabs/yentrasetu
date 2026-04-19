const { Subscription, User } = require('../models');

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxListings: 5,
    featuredListings: 0,
    features: ['Standard Support', 'Basic Search Visibility']
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 2999,
    maxListings: 20,
    featuredListings: 2,
    features: ['Priority Support', 'Enhanced Search Visibility', '2 Featured Listings']
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 9999,
    maxListings: 100,
    featuredListings: 10,
    features: ['Dedicated Account Manager', 'Verified Badge', '10 Featured Listings', 'Priority Search']
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 19999,
    maxListings: -1, // Unlimited
    featuredListings: 50,
    features: ['Bulk Upload Support', 'API Access', 'Custom Analytics', '50 Featured Listings']
  }
};

exports.getPlans = async (req, res) => {
  try {
    res.json({ success: true, plans: Object.values(PLANS) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const user = await User.findByPk(req.userId);
    
    // Simulate subscription creation
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 day subscription

    const subscription = await Subscription.create({
      userId: user.id,
      plan: planId,
      status: 'active',
      startDate: new Date(),
      endDate: endDate,
      maxListings: plan.maxListings,
      featuredListings: plan.featuredListings,
      amount: plan.price
    });

    // Update user profile
    await user.update({
      accountTier: planId,
      subscriptionExpiry: endDate
    });

    res.json({ success: true, subscription, message: `Successfully subscribed to ${plan.name} plan!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.userId, status: 'active' }
    });

    if (!subscription) return res.status(404).json({ success: false, message: 'No active subscription found' });

    await subscription.update({ status: 'cancelled' });
    
    // Revert user to free tier
    await User.update({ accountTier: 'free' }, { where: { id: req.userId } });

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
