import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { storeUpload, handleMulterError } from '../middleware/upload.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus,
  getFeaturedBrands
} from '../controllers/brandController.js';

const router = express.Router();

// ----------------------
// Public routes
// ----------------------
router.get('/', getAllBrands);
router.get('/featured', getFeaturedBrands);
router.get('/:id', getBrandById);

// ----------------------
// Protected routes
// ----------------------
router.post('/',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  storeUpload, // Handles 'logo', 'coverImage', 'tinCertificate'
  handleMulterError,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name is required and must be 1–100 characters'),
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
  createBrand
);

router.put('/:id',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  storeUpload,
  handleMulterError,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1–100 characters'),
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
  updateBrand
);

router.delete('/:id',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  deleteBrand
);

router.patch('/:id/toggle-status',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  toggleBrandStatus
);

export default router;
