const bcrypt = require('bcryptjs');
const { User, OTP, UserSession } = require('./sequelize');
const { sequelize } = require('../../../shared/sequelize');
const { Op } = require('sequelize');

class UserModel {
  /**
   * Create a new user record
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const { phone, email, password } = userData;
    
    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    // Create user with Sequelize
    const user = await User.create({
      phone,
      email,
      password: hashedPassword
    });
    
    // Return user data without password
    return user;
  }
  
  /**
   * Find user by phone number
   * @param {string} phone - Phone number
   * @returns {Promise<Object|null>} User data or null if not found
   */
  static async findByPhone(phone) {
    return await User.scope('withPassword').findOne({
      where: { phone }
    });
  }
  
  /**
   * Find user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User data or null if not found
   */
  static async findByEmail(email) {
    return await User.scope('withPassword').findOne({
      where: { email }
    });
  }
  
  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User data or null if not found
   */
  static async findById(userId) {
    return await User.findOne({
      where: { user_id: userId }
    });
  }
  
  /**
   * Update user data
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object|null>} Updated user or null if not found
   */
  static async update(userId, userData) {
    // Process password if it's being updated
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    // Update user with Sequelize
    const [updatedRowsCount, updatedRows] = await User.update(userData, {
      where: { user_id: userId },
      returning: true
    });
    
    if (updatedRowsCount === 0) {
      return null;
    }
    
    return updatedRows[0];
  }
  
  /**
   * Store OTP for phone verification
   * @param {string} phone - Phone number
   * @param {string} otpHash - Hashed OTP
   * @param {number} expiryMinutes - OTP expiry in minutes
   * @returns {Promise<Object>} Created OTP record
   */
  static async storeOtp(phone, otpHash, expiryMinutes = 10) {
    // Delete any existing OTPs for this phone
    await OTP.destroy({ where: { phone } });
    
    // Calculate expiry time
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + expiryMinutes);
    
    // Store new OTP
    const otp = await OTP.create({
      phone,
      otp_hash: otpHash,
      expires_at: expiryDate
    });
    
    return otp;
  }
  
  /**
   * Verify OTP
   * @param {string} phone - Phone number
   * @param {string} otp - OTP to verify
   * @returns {Promise<boolean>} True if OTP is valid, false otherwise
   */
  static async verifyOtp(phone, otp) {
    // Find valid OTP record
    const otpRecord = await OTP.findOne({
      where: {
        phone,
        expires_at: { [Op.gt]: new Date() }
      }
    });
    
    if (!otpRecord) {
      return false;
    }
    
    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    
    // Delete OTP if valid
    if (isValid) {
      await otpRecord.destroy();
    }
    
    return isValid;
  }
  
  /**
   * Create a new session
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token
   * @param {number} expiryDays - Session expiry in days
   * @returns {Promise<Object>} Created session
   */
  static async createSession(userId, refreshToken, expiryDays = 30) {
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    // Create session
    const session = await UserSession.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiryDate
    });
    
    return session;
  }
  
  /**
   * Find session by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object|null>} Session data or null if not found
   */
  static async findSessionByToken(refreshToken) {
    return await UserSession.findOne({
      where: {
        refresh_token: refreshToken,
        expires_at: { [Op.gt]: new Date() }
      }
    });
  }
  
  /**
   * Delete a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async deleteSession(sessionId) {
    const deletedCount = await UserSession.destroy({
      where: { session_id: sessionId }
    });
    
    return deletedCount > 0;
  }
  
  /**
   * Delete all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted sessions
   */
  static async deleteAllUserSessions(userId) {
    return await UserSession.destroy({
      where: { user_id: userId }
    });
  }
}

module.exports = UserModel;
