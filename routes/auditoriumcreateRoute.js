import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { storeUpload, handleMulterError } from '../middleware/upload.js';
import { validateRequest } from '../utils/validation.js';
import {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  validateVehicleIdentity,
} from '../controllers/vehicleController.js';

const router = express.Router();

router.get('/', getVehicles);

router.get('/:id',
  authenticate,
  authorize(['vehicle']),
  getVehicle
);

router.post('/',
  authenticate,
  authorize(['vehicle']),
  storeUpload,
  handleMulterError,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name is required and must be 1–100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('brand')
      .notEmpty()
      .withMessage('Brand is required'),
    body('category')
      .notEmpty()
      .withMessage('Category is required'),
    body('model')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Model is required'),
    body('type')
      .isIn(['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'motorcycle'])
      .withMessage('Invalid vehicle type'),
    body('engineCapacity')
      .isNumeric()
      .withMessage('Engine capacity must be a number'),
    body('enginePower')
      .isNumeric()
      .withMessage('Engine power must be a number'),
    body('seatingCapacity')
      .isNumeric()
      .withMessage('Seating capacity must be a number'),
    body('fuelType')
      .isIn(['petrol', 'diesel', 'electric', 'hybrid'])
      .withMessage('Invalid fuel type'),
    body('transmissionType')
      .isIn(['manual', 'automatic'])
      .withMessage('Invalid transmission type'),
    body('pricing.hourly')
      .optional()
      .isNumeric()
      .withMessage('Hourly pricing must be a number'),
    body('pricing.perDay')
      .optional()
      .isNumeric()
      .withMessage('Per day pricing must be a number'),
    body('pricing.distanceWise')
      .optional()
      .isNumeric()
      .withMessage('Distance-wise pricing must be a number'),
    body('discount')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Discount must be between 0 and 100'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('isAvailable')
      .optional()
      .isBoolean()
      .withMessage('isAvailable must be a boolean'),
    body('vinNumber')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('VIN number must be at least 1 character'),
    body('licensePlateNumber')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('License plate number must be at least 1 character'),
  ],
  validateRequest,
  createVehicle
);

router.put('/:id',
  authenticate,
  authorize(['vehicle']),
  storeUpload,
  handleMulterError,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1–100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('brand')
      .optional()
      .notEmpty()
      .withMessage('Brand is required'),
    body('category')
      .optional()
      .notEmpty()
      .withMessage('Category is required'),
    body('model')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Model is required'),
    body('type')
      .optional()
      .isIn(['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'motorcycle'])
      .withMessage('Invalid vehicle type'),
    body('engineCapacity')
      .optional()
      .isNumeric()
      .withMessage('Engine capacity must be a number'),
    body('enginePower')
      .optional()
      .isNumeric()
      .withMessage('Engine power must be a number'),
    body('seatingCapacity')
      .optional()
      .isNumeric()
      .withMessage('Seating capacity must be a number'),
    body('fuelType')
      .optional()
      .isIn(['petrol', 'diesel', 'electric', 'hybrid'])
      .withMessage('Invalid fuel type'),
    body('transmissionType')
      .optional()
      .isIn(['manual', 'automatic'])
      .withMessage('Invalid transmission type'),
    body('pricing.hourly')
      .optional()
      .isNumeric()
      .withMessage('Hourly pricing must be a number'),
    body('pricing.perDay')
      .optional()
      .isNumeric()
      .withMessage('Per day pricing must be a number'),
    body('pricing.distanceWise')
      .optional()
      .isNumeric()
      .withMessage('Distance-wise pricing must be a number'),
    body('discount')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Discount must be between 0 and 100'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('isAvailable')
      .optional()
      .isBoolean()
      .withMessage('isAvailable must be a boolean'),
    body('vinNumber')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('VIN number must be at least 1 character'),
    body('licensePlateNumber')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('License plate number must be at least 1 character'),
  ],
  validateRequest,
  updateVehicle
);

router.delete('/:id',
  authenticate,
  authorize(['vehicle']),
  deleteVehicle
);

router.post('/validate',
  authenticate,
  authorize(['vehicle']),
  [
    body('vinNumber')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('VIN number must be at least 1 character'),
    body('licensePlateNumber')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('License plate number must be at least 1 character'),
  ],
  validateRequest,
  validateVehicleIdentity
);

export default router;