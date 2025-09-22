const RegistrationModel = require('../models/registrationModel');
const { ApiError } = require('../../../shared/error-handler');
const { logger } = require('../../../shared/logger');
// const axios = require('axios');

class RegistrationController {
  /**
   * Register a member
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async registerMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const { consent_flags } = req.body;
      
      const existingRegistration = await RegistrationModel.findByMemberId(memberId);
      if (existingRegistration && existingRegistration.status === 'registered') {
        return res.status(200).json({
          success: true,
          message: 'Member is already registered',
          data: existingRegistration
        });
      }
      
      if (existingRegistration) {
        const updatedRegistration = await RegistrationModel.updateStatus(memberId, {
          status: 'pending',
          consent_flags
        });
        
        this._triggerRegistrationProcess(memberId);
        
        return res.status(200).json({
          success: true,
          message: 'Registration process restarted',
          data: updatedRegistration
        });
      }
      
      const registration = await RegistrationModel.create({
        member_id: memberId,
        status: 'pending',
        consent_flags
      });
      
      // Trigger registration process
      this._triggerRegistrationProcess(memberId);
      
      res.status(201).json({
        success: true,
        message: 'Registration process initiated',
        data: registration
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get registration status for a member
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getRegistrationStatus(req, res, next) {
    try {
      const { memberId } = req.params;
      
      const registration = await RegistrationModel.findByMemberId(memberId);
      
      if (!registration) {
        throw new ApiError(404, `Registration not found for member ${memberId}`);
      }
      
      res.status(200).json({
        success: true,
        data: registration
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get registration history for a member
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getRegistrationHistory(req, res, next) {
    try {
      const { memberId } = req.params;
      
      const history = await RegistrationModel.getRegistrationHistory(memberId);
      
      res.status(200).json({
        success: true,
        count: history.length,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync registration with hospital system
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async syncRegistration(req, res, next) {
    try {
      const { memberId } = req.params;
      
      const registration = await RegistrationModel.findByMemberId(memberId);
      
      if (!registration) {
        throw new ApiError(404, `Registration not found for member ${memberId}`);
      }
      
      if (registration.status !== 'registered') {
        throw new ApiError(400, `Cannot sync registration that is not in 'registered' status`);
      }
      
      this._triggerSyncProcess(memberId);
      
      res.status(200).json({
        success: true,
        message: 'Sync process initiated',
        data: registration
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle webhook from hospital system
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async hospitalWebhook(req, res, next) {
    try {
      const { member_id, hospital_guid, status, error_message } = req.body;
      
      if (!member_id) {
        throw new ApiError(400, 'member_id is required');
      }
      
      const registration = await RegistrationModel.findByMemberId(member_id);
      
      if (!registration) {
        throw new ApiError(404, `Registration not found for member ${member_id}`);
      }
      
      const updatedRegistration = await RegistrationModel.updateStatus(member_id, {
        status,
        hospital_guid,
        error_message
      });
      
      if (status === 'registered' && hospital_guid) {
        logger.info(`Event: member.registered, member_id: ${member_id}, hospital_guid: ${hospital_guid}`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: updatedRegistration
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Mock process to check registration status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async mockRegistrationProcess(req, res, next) {
    try {
      const { memberId } = req.params;
      const { status, hospital_guid, error_message } = req.body;
      
      const updatedRegistration = await RegistrationModel.updateStatus(memberId, {
        status,
        hospital_guid,
        error_message
      });
      
      if (!updatedRegistration) {
        throw new ApiError(404, `Registration not found for member ${memberId}`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Registration status updated',
        data: updatedRegistration
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Trigger the registration process
   * @param {string} memberId - Member ID
   * @private
   */
  static async _triggerRegistrationProcess(memberId) {
    
    setTimeout(async () => {
      try {
        
        const success = Math.random() > 0.2;
        
        if (success) {
          const hospitalGuid = `H${Math.floor(Math.random() * 10000000)}`;
          
          await RegistrationModel.updateStatus(memberId, {
            status: 'registered',
            hospital_guid: hospitalGuid
          });
          logger.info(`Member ${memberId} registered with hospital GUID ${hospitalGuid}`);
        } else {
          await RegistrationModel.updateStatus(memberId, {
            status: 'failed',
            error_message: 'Failed to register with hospital system'
          });
        }
      } catch (error) {
        logger.error('Error in registration process:', error);
        
        await RegistrationModel.updateStatus(memberId, {
          status: 'failed',
          error_message: error.message
        });
      }
    }, 2000);
  }
  
  /**
   * Trigger the sync process
   * @param {string} memberId - Member ID
   * @private
   */
  static async _triggerSyncProcess(memberId) {
    logger.info(`Triggering sync for member ${memberId}`);
    await RegistrationModel.createHistoryRecord({
      member_id: memberId,
      status: 'registered',
      event_type: 'sync',
      event_details: {
        triggered_by: 'api',
        timestamp: new Date().toISOString()
      }
    });
  }
}

module.exports = RegistrationController;
