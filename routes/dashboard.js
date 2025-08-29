import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, authorize('admin', 'manager'), getDashboardStats);

export default router;