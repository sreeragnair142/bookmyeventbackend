// Updated Routes: audicategoryRoutes.js (assuming this is the router file)
// Changes: Use categoryUpload (which is upload.fields for 'categoryImage' and 'auditoriumCategoryImage') instead of upload.single
// Updated validation comments accordingly

import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { categoryUpload } from '../middleware/upload.js'; // Import categoryUpload instead of upload
import { handleMulterError } from '../middleware/upload.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllAuditoriumCategories,
  getAuditoriumCategoryById,
  createAuditoriumCategory,
  updateAuditoriumCategory,
  deleteAuditoriumCategory,
  toggleAuditoriumCategoryStatus,
  getFeaturedAuditoriumCategories
} from '../controllers/audicategoryController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllAuditoriumCategories);
router.get('/featured', getFeaturedAuditoriumCategories);
router.get('/:id', getAuditoriumCategoryById);

// Protected routes (authentication required)
router.post('/',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  // Use categoryUpload to support both 'categoryImage' and 'auditoriumCategoryImage'
  categoryUpload,
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
      .optional({ checkFalsy: true })
      .isMongoId()
      .withMessage('Valid parent auditorium category ID required'),
    body('displayOrder')
      .optional({ checkFalsy: true })
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
  createAuditoriumCategory
);

router.put('/:id',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  // Use categoryUpload to support both 'categoryImage' and 'auditoriumCategoryImage'
  categoryUpload,
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
      .optional({ checkFalsy: true })
      .isMongoId()
      .withMessage('Valid parent auditorium category ID required'),
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
  updateAuditoriumCategory
);

router.delete('/:id', 
  authenticate, 
  authorize('admin', 'manager', 'superadmin'), 
  deleteAuditoriumCategory
);

router.patch('/:id/toggle-status', 
  authenticate, 
  authorize('admin', 'manager', 'superadmin'), 
  toggleAuditoriumCategoryStatus
);

export default router;