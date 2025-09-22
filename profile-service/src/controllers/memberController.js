const MemberModel = require('../models/memberModel');
const { ApiError } = require('../../../shared/error-handler');
const { logger } = require('../../../shared/logger');
class MemberController {
  /**
   * Get all members for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getUserMembers(req, res, next) {
    try {
      const { userId } = req.params;
      
      if (req.user.user_id !== userId) {
        throw new ApiError(403, 'You do not have permission to access these members');
      }
      
      const members = await MemberModel.findByUserId(userId);
      
      res.status(200).json({
        success: true,
        count: members.length,
        data: members
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new member
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createMember(req, res, next) {
    try {
      const { userId } = req.params;
      
      if (req.user.user_id !== userId) {
        throw new ApiError(403, 'You do not have permission to create members for this user');
      }
      
      const memberData = {
        ...req.body,
        user_id: userId
      };
      
      const member = await MemberModel.create(memberData);
      
      res.status(201).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a member by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getMemberById(req, res, next) {
    try {
      const { memberId } = req.params;
      
      const member = await MemberModel.findById(memberId);
      
      if (!member) {
        throw new ApiError(404, `Member not found with id ${memberId}`);
      }
      
      const hasAccess = await MemberModel.checkAccess(req.user.user_id, memberId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have permission to view this member');
      }
      
      res.status(200).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a member
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const updateData = req.body;
      
      const existingMember = await MemberModel.findById(memberId);
      if (!existingMember) {
        throw new ApiError(404, `Member not found with id ${memberId}`);
      }
      
      const hasAccess = await MemberModel.checkAccess(req.user.user_id, memberId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have permission to update this member');
      }
      
      const updatedMember = await MemberModel.update(memberId, updateData);
      
      res.status(200).json({
        success: true,
        data: updatedMember
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a member
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteMember(req, res, next) {
    try {
      const { memberId } = req.params;
      
      const existingMember = await MemberModel.findById(memberId);
      if (!existingMember) {
        throw new ApiError(404, `Member not found with id ${memberId}`);
      }
      
      const hasAccess = await MemberModel.checkAccess(req.user.user_id, memberId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have permission to delete this member');
      }
      
      const deleted = await MemberModel.delete(memberId);
      logger.info('Deleted member:', deleted);
      res.status(200).json({
        success: true,
        message: `Member with id ${memberId} deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Link an existing member to a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async linkExistingMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const { relationship_type } = req.body;
      const userId = req.user.user_id;
      
      const existingMember = await MemberModel.findById(memberId);
      if (!existingMember) {
        throw new ApiError(404, `Member not found with id ${memberId}`);
      }
      
      const link = await MemberModel.linkExistingMember(
        memberId,
        userId,
        relationship_type
      );
      logger.info('Linked existing member:', link);
      res.status(200).json({
        success: true,
        data: {
          memberId,
          userId,
          relationshipType: relationship_type
        },
        message: 'Member linked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Find member by phone or hospital GUID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async findMember(req, res, next) {
    try {
      const { phone, hospital_guid } = req.query;
      let member = null;
      
      if (phone) {
        member = await MemberModel.findByPhone(phone);
      } else if (hospital_guid) {
        member = await MemberModel.findByHospitalGuid(hospital_guid);
      } else {
        throw new ApiError(400, 'Either phone or hospital_guid is required');
      }
      
      if (!member) {
        throw new ApiError(404, 'Member not found');
      }
      
      res.status(200).json({
        success: true,
        data: {
          member_id: member.member_id,
          name: member.name,
          phone: member.phone,
          hospital_guid: member.hospital_guid
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MemberController;
