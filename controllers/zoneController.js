import Zone from '../models/Zone.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllZones = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive,
      search 
    } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const zones = await Zone.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Zone.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { zones }, pagination, 'Zones fetched successfully');
  } catch (error) {
    console.error('Get zones error:', error);
    return errorResponse(res, 'Error fetching zones', 500);
  }
};

export const getZoneById = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!zone) {
      return errorResponse(res, 'Zone not found', 404);
    }

    return successResponse(res, { zone }, 'Zone fetched successfully');
  } catch (error) {
    console.error('Get zone error:', error);
    return errorResponse(res, 'Error fetching zone', 500);
  }
};

export const createZone = async (req, res) => {
  try {
    const zoneData = {
      ...req.body,
      createdBy: req.user._id
    };

    const zone = new Zone(zoneData);
    await zone.save();

    const populatedZone = await Zone.findById(zone._id)
      .populate('createdBy', 'firstName lastName');

    return successResponse(res, { zone: populatedZone }, 'Zone created successfully', 201);
  } catch (error) {
    console.error('Create zone error:', error);
    return errorResponse(res, 'Error creating zone', 500);
  }
};

export const updateZone = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    
    if (!zone) {
      return errorResponse(res, 'Zone not found', 404);
    }

    const updatedZone = await Zone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    return successResponse(res, { zone: updatedZone }, 'Zone updated successfully');
  } catch (error) {
    console.error('Update zone error:', error);
    return errorResponse(res, 'Error updating zone', 500);
  }
};

export const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    
    if (!zone) {
      return errorResponse(res, 'Zone not found', 404);
    }

    await Zone.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Zone deleted successfully');
  } catch (error) {
    console.error('Delete zone error:', error);
    return errorResponse(res, 'Error deleting zone', 500);
  }
};

export const toggleZoneStatus = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    
    if (!zone) {
      return errorResponse(res, 'Zone not found', 404);
    }

    zone.isActive = !zone.isActive;
    await zone.save();

    return successResponse(res, { zone }, `Zone ${zone.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle zone status error:', error);
    return errorResponse(res, 'Error updating zone status', 500);
  }
};

export const checkPointInZone = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const zone = await Zone.findOne({
      isActive: true,
      coordinates: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        }
      }
    });

    if (!zone) {
      return errorResponse(res, 'No active zone found for this location', 404);
    }

    return successResponse(res, { zone }, 'Zone found for location');
  } catch (error) {
    console.error('Check point in zone error:', error);
    return errorResponse(res, 'Error checking zone coverage', 500);
  }
};