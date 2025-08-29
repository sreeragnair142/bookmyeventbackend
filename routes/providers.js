import express from 'express';
import { body } from 'express-validator';
import Provider from '../models/Provider.js';
import { authenticate, authorize } from '../middleware/auth.js';
import upload, { handleMulterError } from '../middleware/upload.js';
import { validateRequest } from '../utils/validation.js';

const router = express.Router();

// Get all providers
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      zone, 
      isActive,
      isApproved,
      isFeatured,
      search 
    } = req.query;

    const filter = {};
    if (zone) filter.zone = zone;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { ownerFirstName: { $regex: search, $options: 'i' } },
        { ownerLastName: { $regex: search, $options: 'i' } }
      ];
    }

    const providers = await Provider.find(filter)
      .populate('zone', 'name')
      .populate('categories', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Provider.countDocuments(filter);

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching providers'
    });
  }
});

// Get provider by ID
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('zone', 'name')
      .populate('categories', 'name image')
      .populate('approvedBy', 'firstName lastName');

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.json({
      success: true,
      data: { provider }
    });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provider'
    });
  }
});

// Update provider
router.put('/:id',
  authenticate,
  authorize('admin', 'manager'),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  handleMulterError,
  [
    body('storeName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Store name must be 1-100 characters'),
    body('ownerEmail').optional().isEmail().withMessage('Valid email is required'),
    body('zone').optional().isMongoId().withMessage('Valid zone ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const provider = await Provider.findById(req.params.id);
      
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found'
        });
      }

      const updateData = { ...req.body };
      
      if (req.files) {
        if (req.files.logo) {
          updateData.logo = req.files.logo[0].path.replace(/\\/g, '/');
        }
        if (req.files.coverImage) {
          updateData.coverImage = req.files.coverImage[0].path.replace(/\\/g, '/');
        }
      }

      const updatedProvider = await Provider.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        { path: 'zone', select: 'name' },
        { path: 'categories', select: 'name' },
        { path: 'approvedBy', select: 'firstName lastName' }
      ]);

      res.json({
        success: true,
        message: 'Provider updated successfully',
        data: { provider: updatedProvider }
      });
    } catch (error) {
      console.error('Update provider error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating provider'
      });
    }
  }
);

// Toggle provider status
router.patch('/:id/toggle-status', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    provider.isActive = !provider.isActive;
    await provider.save();

    res.json({
      success: true,
      message: `Provider ${provider.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { provider }
    });
  } catch (error) {
    console.error('Toggle provider status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating provider status'
    });
  }
});

// Toggle featured status
router.patch('/:id/toggle-featured', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    provider.isFeatured = !provider.isFeatured;
    await provider.save();

    res.json({
      success: true,
      message: `Provider ${provider.isFeatured ? 'marked as featured' : 'removed from featured'} successfully`,
      data: { provider }
    });
  } catch (error) {
    console.error('Toggle featured status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating featured status'
    });
  }
});

// Delete provider
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    await Provider.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting provider'
    });
  }
});

export default router;