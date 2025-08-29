import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats
} from '../controllers/userController.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), getAllUsers);

// Get user statistics
router.get('/stats', authenticate, authorize('admin'), getUserStats);

// Get user by ID
router.get('/:id', authenticate, authorize('admin', 'manager'), getUserById);

// Update user
router.put('/:id',
  authenticate,
  authorize('admin'),
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
    body('role').optional().isIn(['admin', 'manager', 'user']).withMessage('Invalid role')
  ],
  validateRequest, updateUser);

// Delete user
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// Toggle user status
router.patch('/:id/toggle-status', authenticate, authorize('admin'), toggleUserStatus);

export default router;