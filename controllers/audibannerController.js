import AuditoriumBanner from '../models/audiBanner.js';
import mongoose from 'mongoose';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllAuditoriumBanners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      zone,
      bannerType,
      isActive,
      isFeatured
    } = req.query;

    const filter = {};
    if (zone) filter.zone = zone;
    if (bannerType) filter.bannerType = bannerType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';

    const banners = await AuditoriumBanner.find(filter)
      .populate('zone', 'name')
      .populate('store', 'storeName')
      .populate('createdBy', 'firstName lastName')
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditoriumBanner.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { banners }, pagination, 'Auditorium banners fetched successfully');
  } catch (error) {
    console.error('Get auditorium banners error:', error);
    return errorResponse(res, 'Error fetching auditorium banners', 500);
  }
};

export const getAuditoriumBannerById = async (req, res) => {
  try {
    const banner = await AuditoriumBanner.findById(req.params.id)
      .populate('zone', 'name')
      .populate('store', 'storeName')
      .populate('createdBy', 'firstName lastName');

    if (!banner) {
      return errorResponse(res, 'Auditorium banner not found', 404);
    }

    return successResponse(res, { banner }, 'Auditorium banner fetched successfully');
  } catch (error) {
    console.error('Get auditorium banner error:', error);
    return errorResponse(res, 'Error fetching auditorium banner', 500);
  }
};

export const createAuditoriumBanner = async (req, res) => {
  try {
    console.log("Incoming auditorium banner body:", req.body);
    console.log("Incoming auditorium banner file:", req.file);
    console.log("User from auth:", req.user);

    const { zone, ...otherData } = req.body;

    let zoneId = zone;
    if (zone && !mongoose.Types.ObjectId.isValid(zone)) {
      const Zone = mongoose.model("Zone");
      const zoneDoc = await Zone.findOne({ name: zone });
      if (!zoneDoc) {
        return errorResponse(res, "Zone not found. Please provide a valid zone ID or name", 400);
      }
      zoneId = zoneDoc._id;
    }

    const bannerData = {
      ...otherData,
      zone: zoneId,
      createdBy: req.user ? req.user._id : null,
    };

    if (req.file && req.file.path) {
      bannerData.image = req.file.path.replace(/\\/g, "/");
    }

    const banner = new AuditoriumBanner(bannerData);
    await banner.save();

    const populatedBanner = await AuditoriumBanner.findById(banner._id)
      .populate("zone", "name")
      .populate("store", "storeName")
      .populate("createdBy", "firstName lastName");

    return successResponse(res, { banner: populatedBanner }, "Auditorium banner created successfully", 201);
  } catch (error) {
    console.error("Create auditorium banner error:", error);
    return errorResponse(res, error.message || "Error creating auditorium banner", 500);
  }
};

export const updateAuditoriumBanner = async (req, res) => {
  try {
    const banner = await AuditoriumBanner.findById(req.params.id);

    if (!banner) {
      return errorResponse(res, 'Auditorium banner not found', 404);
    }

    const updateData = { ...req.body };

    if (updateData.zone && !mongoose.Types.ObjectId.isValid(updateData.zone)) {
      const Zone = mongoose.model('Zone');
      const zoneDoc = await Zone.findOne({ name: updateData.zone });
      if (!zoneDoc) {
        return errorResponse(res, 'Zone not found. Please provide a valid zone ID or name', 400);
      }
      updateData.zone = zoneDoc._id;
    }

    if (req.file) {
      updateData.image = req.file.path.replace(/\\/g, '/');
    }

    const updatedBanner = await AuditoriumBanner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'zone', select: 'name' },
      { path: 'store', select: 'storeName' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    return successResponse(res, { banner: updatedBanner }, 'Auditorium banner updated successfully');
  } catch (error) {
    console.error('Update auditorium banner error:', error);
    return errorResponse(res, 'Error updating auditorium banner', 500);
  }
};

export const deleteAuditoriumBanner = async (req, res) => {
  try {
    const banner = await AuditoriumBanner.findById(req.params.id);

    if (!banner) {
      return errorResponse(res, 'Auditorium banner not found', 404);
    }

    await AuditoriumBanner.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Auditorium banner deleted successfully');
  } catch (error) {
    console.error('Delete auditorium banner error:', error);
    return errorResponse(res, 'Error deleting auditorium banner', 500);
  }
};

export const toggleAuditoriumBannerStatus = async (req, res) => {
  try {
    const banner = await AuditoriumBanner.findById(req.params.id);

    if (!banner) {
      return errorResponse(res, 'Auditorium banner not found', 404);
    }

    const updateData = {};

    if (req.body.hasOwnProperty('isActive')) {
      updateData.isActive = req.body.isActive;
    }

    if (req.body.hasOwnProperty('isFeatured')) {
      updateData.isFeatured = req.body.isFeatured;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'No valid fields to update', 400);
    }

    const updatedBanner = await AuditoriumBanner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'zone', select: 'name' },
      { path: 'store', select: 'storeName' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    const field = req.body.hasOwnProperty('isActive') ? 'isActive' : 'isFeatured';
    const status = updatedBanner[field] ? 'activated' : 'deactivated';

    return successResponse(res, { banner: updatedBanner }, `Auditorium banner ${status} successfully`);
  } catch (error) {
    console.error('Toggle auditorium banner status error:', error);
    return errorResponse(res, 'Error updating auditorium banner status', 500);
  }
};

export const incrementAuditoriumBannerClick = async (req, res) => {
  try {
    const banner = await AuditoriumBanner.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!banner) {
      return errorResponse(res, 'Auditorium banner not found', 404);
    }

    return successResponse(res, { banner }, 'Auditorium banner click recorded');
  } catch (error) {
    console.error('Increment auditorium banner click error:', error);
    return errorResponse(res, 'Error recording auditorium banner click', 500);
  }
};