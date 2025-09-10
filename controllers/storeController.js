import Store from '../models/Store.js';
import mongoose from 'mongoose';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllStores = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, // Increased default limit for dropdowns
      zone, 
      isActive,
      search 
    } = req.query;

    const filter = {};
    if (zone) {
      if (mongoose.Types.ObjectId.isValid(zone)) {
        filter.zone = zone;
      } else {
        // If zone is not a valid ObjectId, try to find zone by name
        const Zone = mongoose.model('Zone');
        const zoneDoc = await Zone.findOne({ name: { $regex: zone, $options: 'i' } });
        if (zoneDoc) {
          filter.zone = zoneDoc._id;
        } else {
          // If zone not found, return empty result
          return successResponse(res, { stores: [] }, 'No stores found for specified zone');
        }
      }
    }
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const stores = await Store.find(filter)
      .populate('zone', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ storeName: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Store.countDocuments(filter);

    // For API responses without pagination (like dropdowns), return simple format
    if (req.query.simple === 'true') {
      return successResponse(res, { stores }, 'Stores fetched successfully');
    }

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { stores }, pagination, 'Stores fetched successfully');
  } catch (error) {
    console.error('Get stores error:', error);
    return errorResponse(res, 'Error fetching stores', 500);
  }
};

export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('zone', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!store) {
      return errorResponse(res, 'Store not found', 404);
    }

    return successResponse(res, { store }, 'Store fetched successfully');
  } catch (error) {
    console.error('Get store error:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid store ID format', 400);
    }
    return errorResponse(res, 'Error fetching store', 500);
  }
};

export const createStore = async (req, res) => {
  try {
    console.log("Creating store with data:", req.body);
    console.log("User from auth:", req.user);

    const { zone, ...otherData } = req.body;

    let zoneId = zone;
    if (zone && !mongoose.Types.ObjectId.isValid(zone)) {
      const Zone = mongoose.model('Zone');
      const zoneDoc = await Zone.findOne({ name: zone });
      if (!zoneDoc) {
        return errorResponse(res, 'Zone not found. Please provide a valid zone ID or name', 400);
      }
      zoneId = zoneDoc._id;
    }

    // Check if store with same name already exists in the same zone
    const existingStore = await Store.findOne({ 
      storeName: otherData.storeName, 
      zone: zoneId 
    });
    
    if (existingStore) {
      return errorResponse(res, 'A store with this name already exists in the selected zone', 400);
    }

    const storeData = {
      ...otherData,
      zone: zoneId,
      createdBy: req.user ? req.user._id : null
    };

    const store = new Store(storeData);
    await store.save();

    const populatedStore = await Store.findById(store._id)
      .populate('zone', 'name')
      .populate('createdBy', 'firstName lastName');

    return successResponse(res, { store: populatedStore }, 'Store created successfully', 201);
  } catch (error) {
    console.error('Create store error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    return errorResponse(res, error.message || 'Error creating store', 500);
  }
};

export const updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return errorResponse(res, 'Store not found', 404);
    }

    const updateData = { ...req.body };
    
    // Handle zone conversion if provided
    if (updateData.zone && !mongoose.Types.ObjectId.isValid(updateData.zone)) {
      const Zone = mongoose.model('Zone');
      const zoneDoc = await Zone.findOne({ name: updateData.zone });
      if (!zoneDoc) {
        return errorResponse(res, 'Zone not found. Please provide a valid zone ID or name', 400);
      }
      updateData.zone = zoneDoc._id;
    }

    // Check for duplicate store name in the same zone (excluding current store)
    if (updateData.storeName || updateData.zone) {
      const duplicateCheck = await Store.findOne({
        storeName: updateData.storeName || store.storeName,
        zone: updateData.zone || store.zone,
        _id: { $ne: req.params.id }
      });

      if (duplicateCheck) {
        return errorResponse(res, 'A store with this name already exists in the selected zone', 400);
      }
    }

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'zone', select: 'name' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    return successResponse(res, { store: updatedStore }, 'Store updated successfully');
  } catch (error) {
    console.error('Update store error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid store ID format', 400);
    }
    return errorResponse(res, 'Error updating store', 500);
  }
};

export const deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return errorResponse(res, 'Store not found', 404);
    }

    // Check if store is being used in banners
    const Banner = mongoose.model('Banner');
    const bannersUsingStore = await Banner.countDocuments({ store: req.params.id });
    
    if (bannersUsingStore > 0) {
      return errorResponse(res, `Cannot delete store. It is being used in ${bannersUsingStore} banner(s)`, 400);
    }

    await Store.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Store deleted successfully');
  } catch (error) {
    console.error('Delete store error:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid store ID format', 400);
    }
    return errorResponse(res, 'Error deleting store', 500);
  }
};

export const toggleStoreStatus = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return errorResponse(res, 'Store not found', 404);
    }

    const updateData = {};
    
    if (req.body.hasOwnProperty('isActive')) {
      updateData.isActive = req.body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'No valid fields to update', 400);
    }

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'zone', select: 'name' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    const status = updatedStore.isActive ? 'activated' : 'deactivated';
    
    return successResponse(res, { store: updatedStore }, `Store ${status} successfully`);
  } catch (error) {
    console.error('Toggle store status error:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid store ID format', 400);
    }
    return errorResponse(res, 'Error updating store status', 500);
  }
};

export const getStoresByZone = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { isActive = 'true' } = req.query;

    const filter = { zone: zoneId };
    if (isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    const stores = await Store.find(filter)
      .populate('zone', 'name')
      .sort({ storeName: 1 })
      .select('storeName address phone email isActive');

    return successResponse(res, { stores }, 'Stores fetched successfully for zone');
  } catch (error) {
    console.error('Get stores by zone error:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid zone ID format', 400);
    }
    return errorResponse(res, 'Error fetching stores for zone', 500);
  }
};