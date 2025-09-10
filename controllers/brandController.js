// controllers/brandController.js
import Brand from '../models/brand.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

// Utility: generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const getAllBrands = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const brands = await Brand.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Brand.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { brands }, pagination, 'Brands fetched successfully');
  } catch (error) {
    console.error('Get brands error:', error);
    return errorResponse(res, 'Error fetching brands', 500);
  }
};

export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }

    return successResponse(res, { brand }, 'Brand fetched successfully');
  } catch (error) {
    console.error('Get brand error:', error);
    return errorResponse(res, 'Error fetching brand', 500);
  }
};

export const createBrand = async (req, res) => {
  try {
    // Use req.files since storeUpload uses fields()
    const brandImage = req.files?.logo?.[0];
    if (!brandImage) {
      return errorResponse(res, 'Brand logo is required', 400);
    }

    const coverImage = req.files?.coverImage?.[0];
    const tinCertificate = req.files?.tinCertificate?.[0];

    const brandData = {
      ...req.body,
      slug: req.body.slug || generateSlug(req.body.name),
      image: brandImage.path.replace(/\\/g, '/'),
      coverImage: coverImage ? coverImage.path.replace(/\\/g, '/') : undefined,
      tinCertificate: tinCertificate ? tinCertificate.path.replace(/\\/g, '/') : undefined,
      createdBy: req.user?._id
    };

    // Ensure slug uniqueness
    const existingBrand = await Brand.findOne({ slug: brandData.slug });
    if (existingBrand) {
      brandData.slug = `${brandData.slug}-${Date.now()}`;
    }

    const brand = new Brand(brandData);
    await brand.save();

    return successResponse(res, { brand }, 'Brand created successfully', 201);
  } catch (error) {
    console.error('Create brand error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 'Brand name already exists', 400);
    }
    return errorResponse(res, error.message || 'Error creating brand', 500);
  }
};

export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }

    const updateData = { ...req.body };

    if (updateData.name && !updateData.slug) {
      updateData.slug = generateSlug(updateData.name);

      const existingBrand = await Brand.findOne({
        slug: updateData.slug,
        _id: { $ne: req.params.id }
      });
      if (existingBrand) {
        updateData.slug = `${updateData.slug}-${Date.now()}`;
      }
    }

    if (req.file) {
      updateData.image = req.file.path.replace(/\\/g, '/');
    }

    const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    return successResponse(res, { brand: updatedBrand }, 'Brand updated successfully');
  } catch (error) {
    console.error('Update brand error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 'Brand name already exists', 400);
    }
    return errorResponse(res, error.message || 'Error updating brand', 500);
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }

    await Brand.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Brand deleted successfully');
  } catch (error) {
    console.error('Delete brand error:', error);
    return errorResponse(res, 'Error deleting brand', 500);
  }
};

export const toggleBrandStatus = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }

    brand.isActive = !brand.isActive;
    await brand.save();

    return successResponse(res, { brand }, `Brand ${brand.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle brand status error:', error);
    return errorResponse(res, 'Error updating brand status', 500);
  }
};

export const getFeaturedBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);

    return successResponse(res, { brands }, 'Featured brands fetched successfully');
  } catch (error) {
    console.error('Get featured brands error:', error);
    return errorResponse(res, 'Error fetching featured brands', 500);
  }
};
