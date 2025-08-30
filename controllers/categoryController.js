import Category from '../models/Category.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllCategories = async (req, res) => {
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
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Category.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { categories }, pagination, 'Categories fetched successfully');
  } catch (error) {
    console.error('Get categories error:', error);
    return errorResponse(res, 'Error fetching categories', 500);
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Get subcategories
    const subcategories = await Category.find({ parentCategory: category._id })
      .select('name image slug isActive');

    return successResponse(res, { 
      category,
      subcategories 
    }, 'Category fetched successfully');
  } catch (error) {
    console.error('Get category error:', error);
    return errorResponse(res, 'Error fetching category', 500);
  }
};

export const createCategory = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Category image is required', 400);
    }

    // Generate slug from name if not provided
    const generateSlug = (name) => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const categoryData = {
      ...req.body,
      slug: req.body.slug || generateSlug(req.body.name),
      image: req.file.path.replace(/\\/g, '/'),
      createdBy: req.user._id
    };

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug: categoryData.slug });
    if (existingCategory) {
      // Add timestamp to make slug unique
      categoryData.slug = `${categoryData.slug}-${Date.now()}`;
    }

    const category = new Category(categoryData);
    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName');

    return successResponse(res, { category: populatedCategory }, 'Category created successfully', 201);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 'Category name already exists', 400);
    }
    return errorResponse(res, error.message || 'Error creating category', 500);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    const updateData = { ...req.body };
    
    // Generate slug if name is being updated and no slug provided
    if (updateData.name && !updateData.slug) {
      const generateSlug = (name) => {
        return name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };
      
      updateData.slug = generateSlug(updateData.name);
      
      // Check if slug already exists (excluding current category)
      const existingCategory = await Category.findOne({ 
        slug: updateData.slug,
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        updateData.slug = `${updateData.slug}-${Date.now()}`;
      }
    }
    
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

    return successResponse(res, { category: updatedCategory }, 'Category updated successfully');
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 'Category name already exists', 400);
    }
    return errorResponse(res, error.message || 'Error updating category', 500);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Check if category has subcategories
    const subcategories = await Category.countDocuments({ parentCategory: req.params.id });
    if (subcategories > 0) {
      return errorResponse(res, 'Cannot delete category that has subcategories', 400);
    }

    await Category.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Category deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error);
    return errorResponse(res, 'Error deleting category', 500);
  }
};

export const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    category.isActive = !category.isActive;
    await category.save();

    return successResponse(res, { category }, `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle category status error:', error);
    return errorResponse(res, 'Error updating category status', 500);
  }
};

export const getFeaturedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ 
      isFeatured: true, 
      isActive: true 
    })
    .populate('parentCategory', 'name')
    .sort({ displayOrder: 1 })
    .limit(10);

    return successResponse(res, { categories }, 'Featured categories fetched successfully');
  } catch (error) {
    console.error('Get featured categories error:', error);
    return errorResponse(res, 'Error fetching featured categories', 500);
  }
};