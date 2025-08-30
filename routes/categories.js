import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import upload, { handleMulterError } from '../middleware/upload.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getFeaturedCategories
} from '../controllers/categoryController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllCategories);
router.get('/featured', getFeaturedCategories);
router.get('/:id', getCategoryById);

// Protected routes (authentication required)
router.post('/', 
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  upload.single('categoryImage'),
  handleMulterError,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name is required and must be 1-100 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('parentCategory')
      .optional()
      .isMongoId()
      .withMessage('Valid parent category ID required'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean')
  ],
  validateRequest,
  createCategory
);

router.put('/:id',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  upload.single('categoryImage'),
  handleMulterError,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('parentCategory')
      .optional()
      .isMongoId()
      .withMessage('Valid parent category ID required'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean')
  ],
  validateRequest,
  updateCategory
);

router.delete('/:id', 
  authenticate, 
  authorize('admin', 'manager', 'superadmin'), 
  deleteCategory
);

router.patch('/:id/toggle-status', 
  authenticate, 
  authorize('admin', 'manager', 'superadmin'), 
  toggleCategoryStatus
);

export default router;