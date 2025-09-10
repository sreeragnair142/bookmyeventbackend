// controllers/venueBrandController.js
import VenueBrand from '../models/audibrand.js';
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

export const getAllVenueBrands = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const brands = await VenueBrand.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await VenueBrand.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { brands }, pagination, 'Venue brands fetched successfully');
  } catch (error) {
    console.error('Get venue brands error:', error);
    return errorResponse(res, 'Error fetching venue brands', 500);
  }
};

export const getVenueBrandById = async (req, res) => {
  try {
    const brand = await VenueBrand.findById(req.params.id);

    if (!brand) {
      return errorResponse(res, 'Venue brand not found', 404);
    }

    return successResponse(res, { brand }, 'Venue brand fetched successfully');
  } catch (error) {
    console.error('Get venue brand error:', error);
    return errorResponse(res, 'Error fetching venue brand', 500);
  }
};

export const createVenueBrand = async (req, res) => {
  try {
    const brandImage = req.files?.logo?.[0];
    if (!brandImage) {
      return errorResponse(res, 'Venue brand logo is required', 400);
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
    const existingBrand = await VenueBrand.findOne({ slug: brandData.slug });
    if (existingBrand) {
      brandData.slug = `${brandData.slug}-${Date.now()}`;
    }

    const brand = new VenueBrand(brandData);
    await brand.save();

    return successResponse(res, { brand }, 'Venue brand created successfully', 201);
  } catch (error) {
    console.error('Create venue brand error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 'Venue brand name already exists', 400);
    }
    return errorResponse(res, error.message || 'Error creating venue brand', 500);
  }
};

export const updateVenueBrand = async (req, res) => {
  try {
    const brand = await VenueBrand.findById(req.params.id);

    if (!brand) {
      return errorResponse(res, 'Venue brand not found', 404);
    }

    const updateData = { ...req.body };

    if (updateData.name && !updateData.slug) {
      updateData.slug = generateSlug(updateData.name);

      const existingBrand = await VenueBrand.findOne({
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

    const updatedBrand = await VenueBrand.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    return successResponse(res, { brand: updatedBrand }, 'Venue brand updated successfully');
  } catch (error) {
    console.error('Update venue brand error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 'Venue brand name already exists', 400);
    }
    return errorResponse(res, error.message || 'Error updating venue brand', 500);
  }
};

export const deleteVenueBrand = async (req, res) => {
  try {
    const brand = await VenueBrand.findById(req.params.id);

    if (!brand) {
      return errorResponse(res, 'Venue brand not found', 404);
    }

    await VenueBrand.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Venue brand deleted successfully');
  } catch (error) {
    console.error('Delete venue brand error:', error);
    return errorResponse(res, 'Error deleting venue brand', 500);
  }
};

export const toggleVenueBrandStatus = async (req, res) => {
  try {
    const brand = await VenueBrand.findById(req.params.id);

    if (!brand) {
      return errorResponse(res, 'Venue brand not found', 404);
    }

    brand.isActive = !brand.isActive;
    await brand.save();

    return successResponse(res, { brand }, `Venue brand ${brand.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle venue brand status error:', error);
    return errorResponse(res, 'Error updating venue brand status', 500);
  }
};

export const getFeaturedVenueBrands = async (req, res) => {
  try {
    const brands = await VenueBrand.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);

    return successResponse(res, { brands }, 'Featured venue brands fetched successfully');
  } catch (error) {
    console.error('Get featured venue brands error:', error);
    return errorResponse(res, 'Error fetching featured venue brands', 500);
  }
};
