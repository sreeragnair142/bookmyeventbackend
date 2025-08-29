import Provider from '../models/Provider.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllProviders = async (req, res) => {
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

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { providers }, pagination, 'Providers fetched successfully');
  } catch (error) {
    console.error('Get providers error:', error);
    return errorResponse(res, 'Error fetching providers', 500);
  }
};

export const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('zone', 'name')
      .populate('categories', 'name image')
      .populate('approvedBy', 'firstName lastName');

    if (!provider) {
      return errorResponse(res, 'Provider not found', 404);
    }

    return successResponse(res, { provider }, 'Provider fetched successfully');
  } catch (error) {
    console.error('Get provider error:', error);
    return errorResponse(res, 'Error fetching provider', 500);
  }
};

export const updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return errorResponse(res, 'Provider not found', 404);
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

    return successResponse(res, { provider: updatedProvider }, 'Provider updated successfully');
  } catch (error) {
    console.error('Update provider error:', error);
    return errorResponse(res, 'Error updating provider', 500);
  }
};

export const toggleProviderStatus = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return errorResponse(res, 'Provider not found', 404);
    }

    provider.isActive = !provider.isActive;
    await provider.save();

    return successResponse(res, { provider }, `Provider ${provider.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle provider status error:', error);
    return errorResponse(res, 'Error updating provider status', 500);
  }
};

export const toggleFeaturedStatus = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return errorResponse(res, 'Provider not found', 404);
    }

    provider.isFeatured = !provider.isFeatured;
    await provider.save();

    return successResponse(res, { provider }, `Provider ${provider.isFeatured ? 'marked as featured' : 'removed from featured'} successfully`);
  } catch (error) {
    console.error('Toggle featured status error:', error);
    return errorResponse(res, 'Error updating featured status', 500);
  }
};

export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return errorResponse(res, 'Provider not found', 404);
    }

    await Provider.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Provider deleted successfully');
  } catch (error) {
    console.error('Delete provider error:', error);
    return errorResponse(res, 'Error deleting provider', 500);
  }
};

export const getProvidersByZone = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { isFeatured, isActive = true } = req.query;

    const filter = { 
      zone: zoneId,
      isActive: isActive === 'true',
      isApproved: true
    };
    
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }

    const providers = await Provider.find(filter)
      .populate('zone', 'name')
      .populate('categories', 'name')
      .sort({ isFeatured: -1, averageRating: -1 });

    return successResponse(res, { providers }, 'Zone providers fetched successfully');
  } catch (error) {
    console.error('Get providers by zone error:', error);
    return errorResponse(res, 'Error fetching zone providers', 500);
  }
};