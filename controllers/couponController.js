import Coupon from '../models/Coupon.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllCoupons = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      isActive,
      search 
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'name')
      .populate('applicableStores', 'storeName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Coupon.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { coupons }, pagination, 'Coupons fetched successfully');
  } catch (error) {
    console.error('Get coupons error:', error);
    return errorResponse(res, 'Error fetching coupons', 500);
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'name')
      .populate('applicableStores', 'storeName');

    if (!coupon) {
      return errorResponse(res, 'Coupon not found', 404);
    }

    return successResponse(res, { coupon }, 'Coupon fetched successfully');
  } catch (error) {
    console.error('Get coupon error:', error);
    return errorResponse(res, 'Error fetching coupon', 500);
  }
};

export const createCoupon = async (req, res) => {
  try {
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existingCoupon) {
      return errorResponse(res, 'Coupon code already exists', 400);
    }

    // Validate dates
    if (new Date(req.body.expireDate) <= new Date(req.body.startDate)) {
      return errorResponse(res, 'Expire date must be after start date', 400);
    }

    const couponData = {
      ...req.body,
      code: req.body.code.toUpperCase(),
      createdBy: req.user._id
    };

    const coupon = new Coupon(couponData);
    await coupon.save();

    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'name')
      .populate('applicableStores', 'storeName');

    return successResponse(res, { coupon: populatedCoupon }, 'Coupon created successfully', 201);
  } catch (error) {
    console.error('Create coupon error:', error);
    return errorResponse(res, 'Error creating coupon', 500);
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return errorResponse(res, 'Coupon not found', 404);
    }

    // Prevent updating code after creation
    const updateData = { ...req.body };
    delete updateData.code;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'applicableCategories', select: 'name' },
      { path: 'applicableStores', select: 'storeName' }
    ]);

    return successResponse(res, { coupon: updatedCoupon }, 'Coupon updated successfully');
  } catch (error) {
    console.error('Update coupon error:', error);
    return errorResponse(res, 'Error updating coupon', 500);
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return errorResponse(res, 'Coupon not found', 404);
    }

    await Coupon.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Coupon deleted successfully');
  } catch (error) {
    console.error('Delete coupon error:', error);
    return errorResponse(res, 'Error deleting coupon', 500);
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return errorResponse(res, 'Coupon not found', 404);
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return successResponse(res, { coupon }, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    return errorResponse(res, 'Error updating coupon status', 500);
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const now = new Date();

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      expireDate: { $gte: now }
    });

    if (!coupon) {
      return errorResponse(res, 'Invalid or expired coupon code', 404);
    }

    if (coupon.usedCount >= coupon.totalUses) {
      return errorResponse(res, 'Coupon usage limit exceeded', 400);
    }

    return successResponse(res, { coupon }, 'Valid coupon');
  } catch (error) {
    console.error('Validate coupon error:', error);
    return errorResponse(res, 'Error validating coupon', 500);
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    
    const coupon = await Coupon.findOneAndUpdate(
      { 
        code: code.toUpperCase(),
        isActive: true,
        usedCount: { $lt: mongoose.model('Coupon').schema.paths.totalUses }
      },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!coupon) {
      return errorResponse(res, 'Coupon not available or usage limit exceeded', 400);
    }

    return successResponse(res, { coupon }, 'Coupon applied successfully');
  } catch (error) {
    console.error('Apply coupon error:', error);
    return errorResponse(res, 'Error applying coupon', 500);
  }
};