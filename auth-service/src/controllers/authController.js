const UserModel = require('../models/userModel');
const { ApiError } = require('../../../shared/error-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

class AuthController {
  /**
   * Send OTP to phone number
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async sendOtp(req, res, next) {
    try {
      const { phone } = req.body;

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const otpHash = await bcrypt.hash(otp, 10);
      
      await UserModel.storeOtp(phone, otpHash);
      
      if (twilioClient) {
        await twilioClient.messages.create({
          body: `Your Fortis Health OTP is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
      } else {
        console.log(`Development mode: OTP for ${phone} is ${otp}`);
      }
      
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        developmentOtp: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and issue tokens
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async verifyOtp(req, res, next) {
    try {
      const { phone, otp } = req.body;
      
      const isValidOtp = await UserModel.verifyOtp(phone, otp);
      if (!isValidOtp) {
        throw new ApiError(401, 'Invalid or expired OTP');
      }
      
      let user = await UserModel.findByPhone(phone);
      if (!user) {
        user = await UserModel.create({ phone });
      }
      
      const tokens = await AuthController._generateTokens(user.user_id);
      
      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        user: {
          user_id: user.user_id,
          phone: user.phone,
          email: user.email
        },
        ...tokens
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async refresh(req, res, next) {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        throw new ApiError(400, 'Refresh token is required');
      }
      
      const session = await UserModel.findSessionByToken(refresh_token);
      if (!session) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }
      
      const user = await UserModel.findById(session.user_id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      const tokens = await AuthController._generateTokens(user.user_id);
      
      res.status(200).json({
        success: true,
        ...tokens
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke refresh token (logout)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async revoke(req, res, next) {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        throw new ApiError(400, 'Refresh token is required');
      }
      
      const session = await UserModel.findSessionByToken(refresh_token);
      if (session) {
        await UserModel.deleteSession(session.session_id);
      }
      
      res.status(200).json({
        success: true,
        message: 'Token revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getUserProfile(req, res, next) {
    try {
      const { user_id } = req.user;
      
      const user = await UserModel.findById(user_id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      res.status(200).json({
        success: true,
        user: {
          user_id: user.user_id,
          phone: user.phone,
          email: user.email,
          created_at: user.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateUserProfile(req, res, next) {
    try {
      const { user_id } = req.user;
      const { email } = req.body;
      
      const updatedUser = await UserModel.update(user_id, { email });
      if (!updatedUser) {
        throw new ApiError(404, 'User not found');
      }
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          user_id: updatedUser.user_id,
          phone: updatedUser.phone,
          email: updatedUser.email
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate access and refresh tokens
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Access and refresh tokens
   * @private
   */
  static async _generateTokens(userId) {
    const accessToken = jwt.sign(
      { user_id: userId },
      process.env.JWT_SECRET || 'fortis-jwt-secret',
      { expiresIn: '1h' }
    );
    
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    await UserModel.createSession(userId, refreshToken);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600 // 1 hour in seconds
    };
  }
}

module.exports = AuthController;
