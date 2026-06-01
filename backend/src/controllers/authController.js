const { User } = require('../models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Password strength validation
const PASSWORD_MIN_LENGTH = 8;
function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must contain at least one letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  return null; // valid
}

// Register new user
const register = async (req, res) => {
  try {
    const { phone, email, password, firstName, lastName, userType } = req.body;

    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    // Email validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ message: 'Phone number already registered.' });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already registered.' });
      }
    }

    // Validate password strength
    if (password) {
      const pwError = validatePassword(password);
      if (pwError) return res.status(400).json({ message: pwError });
    }

    // Create user
    const user = await User.create({
      phone,
      email,
      password,
      firstName,
      lastName,
      userType: userType || 'individual'
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isVerified: user.isVerified
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
};

// Login with phone/password
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password.' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Please login with OTP.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid phone number or password.' });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        accountTier: user.accountTier,
        isVerified: user.isVerified
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
};

// Send OTP
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find user
    let user = await User.findOne({ where: { phone } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 6);
    user.otpCode = hashedOtp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // TODO: Integrate with SMS service (MSG91, Twilio)
    // For development, return OTP in response
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      message: 'OTP sent successfully.',
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP.', error: error.message });
  }
};

// Verify OTP
const MAX_OTP_ATTEMPTS = 5;
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if OTP exists
    if (!user.otpCode) {
      return res.status(400).json({ message: 'No OTP pending. Please request a new one.' });
    }

    // Check if OTP has expired
    if (user.otpExpiresAt < new Date()) {
      user.otpCode = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Track attempts via metadata
    const meta = user.metadata || {};
    const attempts = (meta.otpAttempts || 0) + 1;

    // Compare hashed OTP
    const otpValid = await bcrypt.compare(otp, user.otpCode);

    if (!otpValid) {
      // Wrong OTP — increment attempts
      if (attempts >= MAX_OTP_ATTEMPTS) {
        // Too many failures — invalidate OTP
        user.otpCode = null;
        user.otpExpiresAt = null;
        user.metadata = { ...meta, otpAttempts: 0 };
        await user.save();
        return res.status(429).json({ message: 'Too many failed attempts. OTP invalidated. Please request a new one.' });
      }
      user.metadata = { ...meta, otpAttempts: attempts };
      await user.save();
      return res.status(400).json({ message: `Invalid OTP. ${MAX_OTP_ATTEMPTS - attempts} attempts remaining.` });
    }

    // Correct OTP — clear everything
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.isVerified = true;
    user.lastLoginAt = new Date();
    user.metadata = { ...meta, otpAttempts: 0 };
    await user.save();

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      message: 'OTP verified successfully.',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        accountTier: user.accountTier,
        isVerified: user.isVerified
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'OTP verification failed.', error: error.message });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required.' });
    }

    const { verifyRefreshToken: verifyRefresh } = require('../middleware/auth');
    const decoded = verifyRefresh(refreshToken);

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive.' });
    }

    const token = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Token refresh failed.', error: error.message });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'otpCode'] },
      include: [
        { association: 'operatorProfile' },
        { association: 'mechanicProfile' }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user.', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'firstName', 'lastName', 'email', 'companyName', 'gstNumber',
      'address', 'city', 'state', 'pincode', 'latitude', 'longitude',
      'profileImage', 'userType'
    ];

    const updateData = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Security check for userType
    if (updateData.userType && !['individual', 'contractor', 'company', 'dealer'].includes(updateData.userType)) {
      delete updateData.userType;
    }

    const user = await User.findByPk(req.userId);
    await user.update(updateData);

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        accountTier: user.accountTier,
        companyName: user.companyName,
        gstNumber: user.gstNumber,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        rating: user.rating,
        reviewCount: user.reviewCount,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.userId);
    
    if (user.password) {
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    // Validate new password strength
    const pwError = validatePassword(newPassword);
    if (pwError) return res.status(400).json({ message: pwError });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password.', error: error.message });
  }
};

module.exports = {
  register,
  login,
  sendOTP,
  verifyOTP,
  refreshToken,
  getMe,
  updateProfile,
  changePassword
};
