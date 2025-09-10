import Auditorium from '../models/audi.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllAuditoriums = async (req, res) => {
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

    const auditoriums = await Auditorium.find(filter)
      .populate('zone', 'name')
      .populate('categories', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Auditorium.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { auditoriums }, pagination, 'Auditoriums fetched successfully');
  } catch (error) {
    console.error('Get auditoriums error:', error);
    return errorResponse(res, 'Error fetching auditoriums', 500);
  }
};

export const getAuditoriumById = async (req, res) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id)
      .populate('zone', 'name')
      .populate('categories', 'name image')
      .populate('approvedBy', 'firstName lastName');

    if (!auditorium) {
      return errorResponse(res, 'Auditorium not found', 404);
    }

    return successResponse(res, { auditorium }, 'Auditorium fetched successfully');
  } catch (error) {
    console.error('Get auditorium error:', error);
    return errorResponse(res, 'Error fetching auditorium', 500);
  }
};

export const updateAuditorium = async (req, res) => {
  try {
    console.log('Update request received for ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const auditorium = await Auditorium.findById(req.params.id);
    if (!auditorium) {
      return errorResponse(res, 'Auditorium not found', 404);
    }

    const updateData = { ...req.body };
    if (req.files) {
      if (req.files.logo) updateData.logo = req.files.logo[0].path.replace(/\\/g, '/');
      if (req.files.coverImage) updateData.coverImage = req.files.coverImage[0].path.replace(/\\/g, '/');
      if (req.files.tinCertificate) updateData.tinCertificate = req.files.tinCertificate[0].path.replace(/\\/g, '/');
    }

    const updatedAuditorium = await Auditorium.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'zone', select: 'name' },
      { path: 'categories', select: 'name' },
      { path: 'approvedBy', select: 'firstName lastName' }
    ]);

    return successResponse(res, { auditorium: updatedAuditorium }, 'Auditorium updated successfully');
  } catch (error) {
    console.error('Update auditorium error:', error);
    return errorResponse(res, 'Error updating auditorium', 500);
  }
};

export const toggleAuditoriumStatus = async (req, res) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id);
    
    if (!auditorium) {
      return errorResponse(res, 'Auditorium not found', 404);
    }

    auditorium.isActive = !auditorium.isActive;
    await auditorium.save();

    return successResponse(res, { auditorium }, `Auditorium ${auditorium.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle auditorium status error:', error);
    return errorResponse(res, 'Error updating auditorium status', 500);
  }
};

export const toggleFeaturedStatus = async (req, res) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id);
    
    if (!auditorium) {
      return errorResponse(res, 'Auditorium not found', 404);
    }

    auditorium.isFeatured = !auditorium.isFeatured;
    await auditorium.save();

    return successResponse(res, { auditorium }, `Auditorium ${auditorium.isFeatured ? 'marked as featured' : 'removed from featured'} successfully`);
  } catch (error) {
    console.error('Toggle featured status error:', error);
    return errorResponse(res, 'Error updating featured status', 500);
  }
};

export const deleteAuditorium = async (req, res) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id);
    
    if (!auditorium) {
      return errorResponse(res, 'Auditorium not found', 404);
    }

    await Auditorium.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Auditorium deleted successfully');
  } catch (error) {
    console.error('Delete auditorium error:', error);
    return errorResponse(res, 'Error deleting auditorium', 500);
  }
};

export const getAuditoriumsByZone = async (req, res) => {
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

    const auditoriums = await Auditorium.find(filter)
      .populate('zone', 'name')
      .populate('categories', 'name')
      .sort({ isFeatured: -1, averageRating: -1 });

    return successResponse(res, { auditoriums }, 'Zone auditoriums fetched successfully');
  } catch (error) {
    console.error('Get auditoriums by zone error:', error);
    return errorResponse(res, 'Error fetching zone auditoriums', 500);
  }
};