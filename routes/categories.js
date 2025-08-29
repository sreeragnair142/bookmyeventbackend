import express from 'express';
import { body } from 'express-validator';
import Category from '../models/Category.js';
import { authenticate, authorize } from '../middleware/auth.js';
import upload, { handleMulterError } from '../middleware/upload.js';
import { validateRequest } from '../utils/validation.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive,
      isFeatured,
      parentCategory,
      search 
    } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (parentCategory !== undefined) {
      filter.parentCategory = parentCategory === 'null' ? null : parentCategory;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get subcategories
    const subcategories = await Category.find({ parentCategory: category._id })
      .select('name image slug isActive');

    res.json({
      success: true,
      data: { 
        category,
        subcategories 
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category'
    });
  }
});

// Create new category
router.post('/', 
  authenticate,
  authorize('admin', 'manager'),
  upload.single('categoryImage'),
  handleMulterError,
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be 1-100 characters'),
    body('parentCategory').optional().isMongoId().withMessage('Valid parent category ID required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Category image is required'
        });
      }

      const categoryData = {
        ...req.body,
        image: req.file.path.replace(/\\/g, '/'),
        createdBy: req.user._id
      };

      const category = new Category(categoryData);
      await category.save();

      const populatedCategory = await Category.findById(category._id)
        .populate('parentCategory', 'name')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category: populatedCategory }
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating category'
      });
    }
  }
);

// Update category
router.put('/:id',
  authenticate,
  authorize('admin', 'manager'),
  upload.single('categoryImage'),
  handleMulterError,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('parentCategory').optional().isMongoId().withMessage('Valid parent category ID required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const updateData = { ...req.body };
      
      if (req.file) {
        updateData.image = req.file.path.replace(/\\/g, '/');
      }

      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        { path: 'parentCategory', select: 'name' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category: updatedCategory }
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating category'
      });
    }
  }
);

// Delete category
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has subcategories
    const subcategories = await Category.countDocuments({ parentCategory: req.params.id });
    if (subcategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that has subcategories'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
});

// Toggle category status
router.patch('/:id/toggle-status', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { category }
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category status'
    });
  }
});

export default router;