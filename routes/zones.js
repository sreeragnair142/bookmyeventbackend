import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  toggleZoneStatus,
  checkPointInZone
} from '../controllers/zoneController.js';

const router = express.Router();

// Get all zones
router.get('/', getAllZones);

// Get zone by ID
router.get('/:id', getZoneById);

// Create new zone
router.post('/', 
  authenticate,
  authorize('admin', 'manager'),
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be 1-100 characters'),
    body('coordinates').isObject().withMessage('Valid coordinates are required'),
    body('deliveryCharge').optional().isNumeric().isFloat({ min: 0 }).withMessage('Delivery charge must be a positive number')
  ],
  validateRequest, createZone);

// Update zone
router.put('/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('deliveryCharge').optional().isNumeric().isFloat({ min: 0 }).withMessage('Delivery charge must be a positive number')
  ],
  validateRequest, updateZone);

// Delete zone
router.delete('/:id', authenticate, authorize('admin'), deleteZone);

// Toggle zone status
router.patch('/:id/toggle-status', authenticate, authorize('admin', 'manager'), toggleZoneStatus);

// Check if point is in zone
router.post('/check-coverage', [
  body('latitude').isNumeric().withMessage('Valid latitude is required'),
  body('longitude').isNumeric().withMessage('Valid longitude is required')
], validateRequest, checkPointInZone);

export default router;