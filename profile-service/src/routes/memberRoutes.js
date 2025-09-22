const express = require('express');
const router = express.Router();
const MemberController = require('../controllers/memberController');
const { validate, memberValidation } = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /users/:userId/members
 * @desc    Get all members for a user
 * @access  Private
 */
router.get(
  '/users/:userId/members',
  MemberController.getUserMembers
);

/**
 * @route   POST /users/:userId/members
 * @desc    Create a new member
 * @access  Private
 */
router.post(
  '/users/:userId/members',
  validate(memberValidation.createSchema),
  MemberController.createMember
);

/**
 * @route   GET /members/:memberId
 * @desc    Get a member by ID
 * @access  Private
 */
router.get(
  '/members/:memberId',
  MemberController.getMemberById
);

/**
 * @route   PUT /members/:memberId
 * @desc    Update a member
 * @access  Private
 */
router.put(
  '/members/:memberId',
  validate(memberValidation.updateSchema),
  MemberController.updateMember
);

/**
 * @route   DELETE /members/:memberId
 * @desc    Delete a member
 * @access  Private
 */
router.delete(
  '/members/:memberId',
  MemberController.deleteMember
);

/**
 * @route   POST /members/:memberId/link-existing
 * @desc    Link an existing member to a user
 * @access  Private
 */
router.post(
  '/members/:memberId/link-existing',
  validate(memberValidation.linkSchema),
  MemberController.linkExistingMember
);

/**
 * @route   GET /members/find
 * @desc    Find a member by phone or hospital GUID
 * @access  Private
 */
router.get(
  '/members/find',
  MemberController.findMember
);

module.exports = router;
