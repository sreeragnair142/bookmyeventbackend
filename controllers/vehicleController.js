import Vehicle from '../models/Vehicle.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getVehicles = async (req, res) => {
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

    const vehicles = await Vehicle.find(filter)
      .populate('brand', 'name image')
      .populate('category', 'name image')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Vehicle.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    };

    return paginatedResponse(res, { vehicles }, pagination, 'Vehicles fetched successfully');
  } catch (error) {
    console.error('Get vehicles error:', error);
    return errorResponse(res, 'Error fetching vehicles', 500);
  }
};

export const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('brand', 'name image')
      .populate('category', 'name image');

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    if (req.user && vehicle.provider.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to access this vehicle', 403);
    }

    return successResponse(res, { vehicle }, 'Vehicle fetched successfully');
  } catch (error) {
    console.error('Get vehicle error:', error);
    return errorResponse(res, 'Error fetching vehicle', 500);
  }
};

export const createVehicle = async (req, res) => {
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

    const vehicle = await Vehicle.create(req.body);

    return successResponse(res, { vehicle }, 'Vehicle created successfully', 201);
  } catch (error) {
    console.error('Create vehicle error:', error);
    return errorResponse(res, 'Error creating vehicle', 500);
  }
};

export const updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    if (vehicle.provider.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this vehicle', 403);
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

    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'brand', select: 'name image' },
      { path: 'category', select: 'name image' },
    ]);

    return successResponse(res, { vehicle }, 'Vehicle updated successfully');
  } catch (error) {
    console.error('Update vehicle error:', error);
    return errorResponse(res, 'Error updating vehicle', 500);
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    if (vehicle.provider.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this vehicle', 403);
    }

    await vehicle.deleteOne();

    return successResponse(res, null, 'Vehicle deleted successfully');
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return errorResponse(res, 'Error deleting vehicle', 500);
  }
};

export const validateVehicleIdentity = async (req, res) => {
  try {
    const { vinNumber, licensePlateNumber } = req.body;

    const existingVehicle = await Vehicle.findOne({
      $or: [
        vinNumber ? { vinNumber } : null,
        licensePlateNumber ? { licensePlateNumber } : null,
      ].filter(Boolean),
    });

    if (existingVehicle) {
      return errorResponse(res, 'VIN or License Plate Number already exists', 400);
    }

    return successResponse(res, null, 'Vehicle identity is valid');
  } catch (error) {
    console.error('Validate vehicle identity error:', error);
    return errorResponse(res, 'Error validating vehicle identity', 500);
  }
};

export default {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  validateVehicleIdentity,
};