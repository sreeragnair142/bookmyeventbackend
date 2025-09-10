// Updated Controller: audicategoryController.js
// Changes: In create and update, use req.files to support multiple possible field names

import AuditoriumCategory from '../models/audiCategory.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllAuditoriumCategories = async (req, res) => {
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

    const categories = await AuditoriumCategory.find(filter)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditoriumCategory.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { categories }, pagination, 'Auditorium categories fetched successfully');
  } catch (error) {
    console.error('Get auditorium categories error:', error);
    return errorResponse(res, 'Error fetching auditorium categories', 500);
  }
};

export const getAuditoriumCategoryById = async (req, res) => {
  try {
    const category = await AuditoriumCategory.findById(req.params.id)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!category) {
      return errorResponse(res, 'Auditorium category not found', 404);
    }

    // Get subcategories
    const subcategories = await AuditoriumCategory.find({ parentCategory: category._id })
      .select('name image slug isActive');

    return successResponse(res, { 
      category,
      subcategories 
    }, 'Auditorium category fetched successfully');
  } catch (error) {
    console.error('Get auditorium category error:', error);
    return errorResponse(res, 'Error fetching auditorium category', 500);
  }
};

export const createAuditoriumCategory = async (req, res) => {
  try {
    // Support both 'auditoriumCategoryImage' and 'categoryImage'
    const file = req.files?.auditoriumCategoryImage?.[0] || req.files?.categoryImage?.[0];
    if (!file) {
      return errorResponse(res, 'Auditorium category image is required', 400);
    }

    // Generate slug from name if not provided
    const generateSlug = (name) => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') 
        .replace(/[\s_-]+/g, '-') 
        .replace(/^-+|-+$/g, ''); 
    };

    const categoryData = {
      ...req.body,
      slug: req.body.slug || generateSlug(req.body.name),
      image: file.path.replace(/\\/g, '/'),
      createdBy: req.user._id
    };

    // Check if slug already exists
    const existingCategory = await AuditoriumCategory.findOne({ slug: categoryData.slug });
    if (existingCategory) {
      categoryData.slug = `${categoryData.slug}-${Date.now()}`;
    }

    const category = new AuditoriumCategory(categoryData);
    await category.save();

    const populatedCategory = await AuditoriumCategory.findById(category._id)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName');

    return successResponse(res, { category: populatedCategory }, 'Auditorium category created successfully', 201);
  } catch (error) {
    console.error('Create auditorium category error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 'Auditorium category name already exists', 400);
    }
    return errorResponse(res, error.message || 'Error creating auditorium category', 500);
  }
};

export const updateAuditoriumCategory = async (req, res) => {
  try {
    const category = await AuditoriumCategory.findById(req.params.id);
    
    if (!category) {
      return errorResponse(res, 'Auditorium category not found', 404);
    }

    const updateData = { ...req.body };
    
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
      
      const existingCategory = await AuditoriumCategory.findOne({ 
        slug: updateData.slug,
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        updateData.slug = `${updateData.slug}-${Date.now()}`;
      }
    }
    
    // Support both 'auditoriumCategoryImage' and 'categoryImage' for update as well
    const file = req.files?.auditoriumCategoryImage?.[0] || req.files?.categoryImage?.[0];
    if (file) {
      updateData.image = file.path.replace(/\\/g, '/');
    }

    const updatedCategory = await AuditoriumCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'parentCategory', select: 'name' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    return successResponse(res, { category: updatedCategory }, 'Auditorium category updated successfully');
  } catch (error) {
    console.error('Update auditorium category error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 'Auditorium category name already exists', 400);
    }
    return errorResponse(res, error.message || 'Error updating auditorium category', 500);
  }
};

export const deleteAuditoriumCategory = async (req, res) => {
  try {
    const category = await AuditoriumCategory.findById(req.params.id);
    
    if (!category) {
      return errorResponse(res, 'Auditorium category not found', 404);
    }

    const subcategories = await AuditoriumCategory.countDocuments({ parentCategory: req.params.id });
    if (subcategories > 0) {
      return errorResponse(res, 'Cannot delete auditorium category that has subcategories', 400);
    }

    await AuditoriumCategory.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Auditorium category deleted successfully');
  } catch (error) {
    console.error('Delete auditorium category error:', error);
    return errorResponse(res, 'Error deleting auditorium category', 500);
  }
};

export const toggleAuditoriumCategoryStatus = async (req, res) => {
  try {
    const category = await AuditoriumCategory.findById(req.params.id);
    
    if (!category) {
      return errorResponse(res, 'Auditorium category not found', 404);
    }

    category.isActive = !category.isActive;
    await category.save();

    return successResponse(res, { category }, `Auditorium category ${category.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle auditorium category status error:', error);
    return errorResponse(res, 'Error updating auditorium category status', 500);
  }
};

export const getFeaturedAuditoriumCategories = async (req, res) => {
  try {
    const categories = await AuditoriumCategory.find({ 
      isFeatured: true, 
      isActive: true 
    })
    .populate('parentCategory', 'name')
    .sort({ displayOrder: 1 })
    .limit(10);

    return successResponse(res, { categories }, 'Featured auditorium categories fetched successfully');
  } catch (error) {
    console.error('Get featured auditorium categories error:', error);
    return errorResponse(res, 'Error fetching featured auditorium categories', 500);
  }
};