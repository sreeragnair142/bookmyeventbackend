import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { storeUpload, handleMulterError } from '../middleware/upload.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllVenueBrands,
  getVenueBrandById,
  createVenueBrand,
  updateVenueBrand,
  deleteVenueBrand,
  toggleVenueBrandStatus,
  getFeaturedVenueBrands
} from '../controllers/audibrandController.js';

const router = express.Router();

// ----------------------
// Public routes
// ----------------------
router.get('/', getAllVenueBrands);
router.get('/featured', getFeaturedVenueBrands);
router.get('/:id', getVenueBrandById);

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
  createVenueBrand
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
  updateVenueBrand
);

router.delete('/:id',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  deleteVenueBrand
);

router.patch('/:id/toggle-status',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  toggleVenueBrandStatus
);

export default router;
