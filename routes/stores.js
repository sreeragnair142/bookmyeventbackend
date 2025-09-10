import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  toggleStoreStatus
} from '../controllers/storeController.js';

const router = express.Router();

// Get all stores (no auth needed for frontend dropdown)
router.get('/', getAllStores);

// Get store by ID
router.get('/:id', getStoreById);

// Create new store
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  [
    body('storeName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Store name is required and must be 1-100 characters'),
    body('zone')
      .notEmpty()
      .withMessage('Zone is required'),
    body('address')
      .optional()
      .custom((val) => {
        // Allow both string and object
        if (typeof val === 'string') {
          if (val.length > 500) {
            throw new Error('Address string cannot exceed 500 characters');
          }
        } else if (typeof val === 'object') {
          if (JSON.stringify(val).length > 1000) {
            throw new Error('Address object is too large');
          }
        }
        return true;
      }),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email')
  ],
  validateRequest,
  createStore
);

// Update store
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  [
    body('storeName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Store name must be 1-100 characters'),
    body('zone')
      .optional()
      .notEmpty()
      .withMessage('Zone cannot be empty'),
    body('address')
      .optional()
      .custom((val) => {
        if (typeof val === 'string') {
          if (val.length > 500) {
            throw new Error('Address string cannot exceed 500 characters');
          }
        } else if (typeof val === 'object') {
          if (JSON.stringify(val).length > 1000) {
            throw new Error('Address object is too large');
          }
        }
        return true;
      }),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email')
  ],
  validateRequest,
  updateStore
);

// Delete store
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  deleteStore
);

// Toggle store status
router.patch(
  '/:id/toggle-status',
  authenticate,
  authorize('admin', 'manager', 'superadmin'),
  toggleStoreStatus
);

export default router;
