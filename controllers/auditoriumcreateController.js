import Auditorium from '../models/Auditorium.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAuditoriums = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, brand, category, type } = req.query;

    const filter = {};
    if (req.user) {
      filter.provider = req.user.id; // Only apply provider filter if user is authenticated
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (type) filter.type = type;

    const auditoriums = await Auditorium.find(filter)
      .populate('brand', 'name image')
      .populate('category', 'name image')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Auditorium.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    };

    return paginatedResponse(res, { auditoriums }, pagination, 'Auditoriums fetched successfully');
  } catch (error) {
    console.error('Get auditoriums error:', error);
    return errorResponse(res, 'Error fetching auditoriums', 500);
  }
};

export const getAuditorium = async (req, res) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id)
      .populate('brand', 'name image')
      .populate('category', 'name image');

    if (!auditorium) {
      return errorResponse(res, 'Auditorium not found', 404);
    }

    if (req.user && auditorium.provider.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to access this auditorium', 403);
    }

    return successResponse(res, { auditorium }, 'Auditorium fetched successfully');
  } catch (error) {
    console.error('Get auditorium error:', error);
    return errorResponse(res, 'Error fetching auditorium', 500);
  }
};

export const createAuditorium = async (req, res) => {
  try {
    req.body.provider = req.user.id;

    if (req.files) {
      if (req.files.thumbnail) {
        req.body.thumbnail = req.files.thumbnail[0].path.replace(/\\/g, '/');
      }
      if (req.files.images) {
        req.body.images = req.files.images.map(file => file.path.replace(/\\/g, '/'));
      }
      if (req.files.documents) {
        req.body.documents = req.files.documents.map(file => file.path.replace(/\\/g, '/'));
      }
    }

    const auditorium = await Auditorium.create(req.body);

    return successResponse(res, { auditorium }, 'Auditorium created successfully', 201);
  } catch (error) {
    console.error('Create auditorium error:', error);
    return errorResponse(res, 'Error creating auditorium', 500);
  }
};

export const updateAuditorium = async (req, res) => {
  try {
    let auditorium = await Auditorium.findById(req.params.id);

    if (!auditorium) {
      return errorResponse(res, 'Auditorium not found', 404);
    }

    if (auditorium.provider.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this auditorium', 403);
    }

    const updateData = { ...req.body };
    if (req.files) {
      if (req.files.thumbnail) {
        updateData.thumbnail = req.files.thumbnail[0].path.replace(/\\/g, '/');
      }
      if (req.files.images) {
        updateData.images = req.files.images.map(file => file.path.replace(/\\/g, '/'));
      }
      if (req.files.documents) {
        updateData.documents = req.files.documents.map(file => file.path.replace(/\\/g, '/'));
      }
    }

    auditorium = await Auditorium.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'brand', select: 'name image' },
      { path: 'category', select: 'name image' },
    ]);

    return successResponse(res, { auditorium }, 'Auditorium updated successfully');
  } catch (error) {
    console.error('Update auditorium error:', error);
    return errorResponse(res, 'Error updating auditorium', 500);
  }
};

export const deleteAuditorium = async (req, res) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id);

    if (!auditorium) {
      return errorResponse(res, 'Auditorium not found', 404);
    }

    if (auditorium.provider.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this auditorium', 403);
    }

    await auditorium.deleteOne();

    return successResponse(res, null, 'Auditorium deleted successfully');
  } catch (error) {
    console.error('Delete auditorium error:', error);
    return errorResponse(res, 'Error deleting auditorium', 500);
  }
};

export const validateAuditoriumIdentity = async (req, res) => {
  try {
    const { vinNumber, licensePlateNumber } = req.body;

    const existingAuditorium = await Auditorium.findOne({
      $or: [
        vinNumber ? { vinNumber } : null,
        licensePlateNumber ? { licensePlateNumber } : null,
      ].filter(Boolean),
    });

    if (existingAuditorium) {
      return errorResponse(res, 'VIN or License Plate Number already exists', 400);
    }

    return successResponse(res, null, 'Auditorium identity is valid');
  } catch (error) {
    console.error('Validate auditorium identity error:', error);
    return errorResponse(res, 'Error validating auditorium identity', 500);
  }
};

export default {
  getAuditoriums,
  getAuditorium,
  createAuditorium,
  updateAuditorium,
  deleteAuditorium,
  validateAuditoriumIdentity,
};