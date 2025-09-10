import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllAuditoriumCoupons,
  getAuditoriumCouponById,
  createAuditoriumCoupon,
  updateAuditoriumCoupon,
  deleteAuditoriumCoupon,
  toggleAuditoriumCouponStatus,
  validateAuditoriumCoupon,
  applyAuditoriumCoupon
} from '../controllers/audicouponController.js';

const router = express.Router();

// Optional auth middleware - allows both authenticated and unauthenticated access
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth header, continue without user
    return next();
  }
  
  // Has auth header, try to authenticate
  authenticate(req, res, next);
};

// Get all auditorium coupons (public access for now, but can be restricted later)
router.get('/', optionalAuth, getAllAuditoriumCoupons);

// Get auditorium coupon by ID (public access)
router.get('/:id', optionalAuth, getAuditoriumCouponById);

// Create new auditorium coupon - with flexible auth for testing
router.post('/', 
  optionalAuth,
  // Optional authorization check - only if user is authenticated
  (req, res, next) => {
    if (req.user) {
      // User is authenticated, check authorization
      return authorize('superadmin', 'admin', 'manager')(req, res, next);
    }
    // No user, continue (for testing purposes)
    next();
  },
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title is required and must be 1-100 characters'),
    body('code')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Code must be 3-20 characters')
      .custom(value => {
        // Ensure code contains only alphanumeric characters and underscores/hyphens
        if (!/^[A-Za-z0-9_-]+$/.test(value)) {
          throw new Error('Code can only contain letters, numbers, underscores, and hyphens');
        }
        return true;
      }),
    body('type')
      .optional()
      .isIn(['percentage', 'fixed_amount', 'free_shipping'])
      .withMessage('Invalid coupon type'),
    body('discount')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Discount must be a positive number'),
    body('discountType')
      .optional()
      .isIn(['percentage', 'amount'])
      .withMessage('Invalid discount type'),
    body('totalUses')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Total uses must be at least 1'),
    body('minPurchase')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Min purchase must be a positive number'),
    body('maxDiscount')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Max discount must be a positive number'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('expireDate')
      .optional()
      .isISO8601()
      .withMessage('Valid expire date is required')
      .custom((value, { req }) => {
        if (value && req.body.startDate) {
          if (new Date(value) <= new Date(req.body.startDate)) {
            throw new Error('Expire date must be after start date');
          }
        }
        return true;
      }),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('applicableCategories')
      .optional()
      .isArray()
      .withMessage('Applicable categories must be an array'),
    body('applicableStores')
      .optional()
      .isArray()
      .withMessage('Applicable stores must be an array')
  ],
  validateRequest,
  createAuditoriumCoupon
);

// Update auditorium coupon
router.put('/:id',
  authenticate,
  authorize('superadmin', 'admin', 'manager'),
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be 1-100 characters'),
    body('discount')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Discount must be a positive number'),
    body('totalUses')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Total uses must be at least 1'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('minPurchase')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Minimum purchase amount must be positive'),
    body('maxDiscount')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Maximum discount amount must be positive'),
    body('applicableCategories')
      .optional()
      .isArray()
      .withMessage('Applicable categories must be an array'),
    body('applicableStores')
      .optional()
      .isArray()
      .withMessage('Applicable stores must be an array'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('expireDate')
      .optional()
      .isISO8601()
      .withMessage('Valid expire date is required')
      .custom((value, { req }) => {
        if (value && req.body.startDate) {
          if (new Date(value) <= new Date(req.body.startDate)) {
            throw new Error('Expire date must be after start date');
          }
        }
        return true;
      })
  ],
  validateRequest,
  updateAuditoriumCoupon
);

// Delete auditorium coupon
router.delete('/:id', 
  authenticate, 
  authorize('superadmin', 'admin', 'manager'), 
  deleteAuditoriumCoupon
);

// Toggle auditorium coupon status
router.patch('/:id/toggle-status', 
  authenticate, 
  authorize('superadmin', 'admin', 'manager'), 
  toggleAuditoriumCouponStatus
);

// Validate auditorium coupon code (public or authenticated)
router.post('/validate', 
  optionalAuth,
  [
    body('code')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Coupon code is required')
  ], 
  validateRequest, 
  validateAuditoriumCoupon
);

// Apply auditorium coupon (requires authentication)
router.post('/apply', 
  authenticate, 
  [
    body('code')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Coupon code is required')
  ], 
  validateRequest, 
  applyAuditoriumCoupon
);

export default router;