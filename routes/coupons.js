import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  applyCoupon
} from '../controllers/couponController.js';

const router = express.Router();

// Get all coupons
router.get('/', getAllCoupons);

// Get coupon by ID
router.get('/:id', getCouponById);

// Create new coupon (temporary without auth for testing)
router.post('/test', createCoupon);

// Create new coupon
router.post('/', 
  authenticate,
  authorize('admin', 'manager'),
  [
    body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required and must be 1-100 characters'),
    body('code').trim().isLength({ min: 3, max: 20 }).withMessage('Code must be 3-20 characters'),
    body('type').isIn(['percentage', 'fixed_amount', 'free_shipping']).withMessage('Invalid coupon type'),
    body('discount').isNumeric().isFloat({ min: 0 }).withMessage('Discount must be a positive number'),
    body('discountType').isIn(['percentage', 'amount']).withMessage('Invalid discount type'),
    body('totalUses').isInt({ min: 1 }).withMessage('Total uses must be at least 1'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('expireDate').isISO8601().withMessage('Valid expire date is required'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validateRequest, 
  createCoupon
);

// Update coupon
router.put('/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters'),
    body('discount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Discount must be a positive number'),
    body('totalUses').optional().isInt({ min: 1 }).withMessage('Total uses must be at least 1'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('minOrderAmount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
    body('maxDiscountAmount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Maximum discount amount must be positive'),
    body('applicableCategories').optional().isArray().withMessage('Applicable categories must be an array'),
    body('applicableStores').optional().isArray().withMessage('Applicable stores must be an array'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('expireDate').optional().isISO8601().withMessage('Valid expire date is required')
  ],
  validateRequest, 
  updateCoupon
);

// Delete coupon
router.delete('/:id', authenticate, authorize('admin', 'manager'), deleteCoupon);

// Toggle coupon status
router.patch('/:id/toggle-status', authenticate, authorize('admin', 'manager'), toggleCouponStatus);

// Validate coupon code
router.post('/validate', authenticate, [
  body('code').trim().isLength({ min: 1 }).withMessage('Coupon code is required')
], validateRequest, validateCoupon);

// Apply coupon
router.post('/apply', authenticate, [
  body('code').trim().isLength({ min: 1 }).withMessage('Coupon code is required')
], validateRequest, applyCoupon);

export default router;