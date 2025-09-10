import AuditoriumCoupon from '../models/audiCoupon.js';
import mongoose from 'mongoose';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllAuditoriumCoupons = async (req, res) => {
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

    // Build populate array dynamically to avoid missing schema errors
    const populateOptions = [];
    
    // Only populate if the referenced models exist
    try {
      // Check if User model exists for createdBy
      mongoose.model('User');
      populateOptions.push({ path: 'createdBy', select: 'firstName lastName' });
    } catch (e) {
      console.log('User model not found, skipping createdBy populate');
    }

    try {
      // Check if Category model exists for applicableCategories
      mongoose.model('Category');
      populateOptions.push({ path: 'applicableCategories', select: 'name' });
    } catch (e) {
      console.log('Category model not found, skipping applicableCategories populate');
    }

    try {
      // Check if Store model exists for applicableStores
      mongoose.model('Store');
      populateOptions.push({ path: 'applicableStores', select: 'storeName' });
    } catch (e) {
      console.log('Store model not found, skipping applicableStores populate');
    }

    // Build query with dynamic populate
    let query = AuditoriumCoupon.find(filter);
    
    if (populateOptions.length > 0) {
      query = query.populate(populateOptions);
    }

    const coupons = await query
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditoriumCoupon.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { coupons }, pagination, 'Auditorium coupons fetched successfully');
  } catch (error) {
    console.error('Get auditorium coupons error:', error);
    return errorResponse(res, 'Error fetching auditorium coupons', 500);
  }
};

export const getAuditoriumCouponById = async (req, res) => {
  try {
    // Build populate array dynamically
    const populateOptions = [];
    
    try {
      mongoose.model('User');
      populateOptions.push({ path: 'createdBy', select: 'firstName lastName' });
    } catch (e) {
      console.log('User model not found, skipping createdBy populate');
    }

    try {
      mongoose.model('Category');
      populateOptions.push({ path: 'applicableCategories', select: 'name' });
    } catch (e) {
      console.log('Category model not found, skipping applicableCategories populate');
    }

    try {
      mongoose.model('Store');
      populateOptions.push({ path: 'applicableStores', select: 'storeName' });
    } catch (e) {
      console.log('Store model not found, skipping applicableStores populate');
    }

    let query = AuditoriumCoupon.findById(req.params.id);
    
    if (populateOptions.length > 0) {
      query = query.populate(populateOptions);
    }

    const coupon = await query;

    if (!coupon) {
      return errorResponse(res, 'Auditorium coupon not found', 404);
    }

    return successResponse(res, { coupon }, 'Auditorium coupon fetched successfully');
  } catch (error) {
    console.error('Get auditorium coupon error:', error);
    return errorResponse(res, 'Error fetching auditorium coupon', 500);
  }
};

export const createAuditoriumCoupon = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    // Validate required fields
    if (!req.body.code) {
      return errorResponse(res, 'Coupon code is required', 400);
    }

    if (!req.body.title) {
      return errorResponse(res, 'Title is required', 400);
    }

    if (!req.body.discount) {
      return errorResponse(res, 'Discount is required', 400);
    }

    // Check if coupon code already exists in auditorium coupons
    const existingCoupon = await AuditoriumCoupon.findOne({ code: req.body.code.toUpperCase() });
    if (existingCoupon) {
      return errorResponse(res, 'Auditorium coupon code already exists', 400);
    }

    // Validate dates
    if (req.body.expireDate && req.body.startDate) {
      if (new Date(req.body.expireDate) <= new Date(req.body.startDate)) {
        return errorResponse(res, 'Expire date must be after start date', 400);
      }
    }

    const couponData = {
      title: req.body.title,
      code: req.body.code.toUpperCase(),
      type: req.body.type || 'percentage',
      discount: parseFloat(req.body.discount),
      discountType: req.body.discountType || 'percentage',
      totalUses: parseInt(req.body.totalUses) || 1,
      minPurchase: parseFloat(req.body.minPurchase) || 0,
      maxDiscount: req.body.maxDiscount ? parseFloat(req.body.maxDiscount) : undefined,
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      expireDate: req.body.expireDate ? new Date(req.body.expireDate) : undefined,
      description: req.body.description || '',
      usedCount: 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    // Only add createdBy if user exists and is authenticated
    if (req.user && req.user._id) {
      couponData.createdBy = req.user._id;
    }

    // Handle optional array fields safely
    if (req.body.applicableCategories && Array.isArray(req.body.applicableCategories)) {
      couponData.applicableCategories = req.body.applicableCategories;
    }

    if (req.body.applicableStores && Array.isArray(req.body.applicableStores)) {
      couponData.applicableStores = req.body.applicableStores;
    }

    console.log('Auditorium coupon data to save:', couponData);

    const coupon = new AuditoriumCoupon(couponData);
    await coupon.save();

    // Build populate array dynamically for response
    const populateOptions = [];
    
    if (coupon.createdBy) {
      try {
        mongoose.model('User');
        populateOptions.push({ path: 'createdBy', select: 'firstName lastName' });
      } catch (e) {
        console.log('User model not found, skipping createdBy populate');
      }
    }

    if (coupon.applicableCategories?.length > 0) {
      try {
        mongoose.model('Category');
        populateOptions.push({ path: 'applicableCategories', select: 'name' });
      } catch (e) {
        console.log('Category model not found, skipping applicableCategories populate');
      }
    }

    if (coupon.applicableStores?.length > 0) {
      try {
        mongoose.model('Store');
        populateOptions.push({ path: 'applicableStores', select: 'storeName' });
      } catch (e) {
        console.log('Store model not found, skipping applicableStores populate');
      }
    }

    let populatedCoupon = coupon;
    if (populateOptions.length > 0) {
      try {
        populatedCoupon = await AuditoriumCoupon.findById(coupon._id).populate(populateOptions);
      } catch (populateError) {
        console.log('Error populating auditorium coupon, returning unpopulated version:', populateError.message);
        populatedCoupon = coupon;
      }
    }

    return successResponse(res, { coupon: populatedCoupon }, 'Auditorium coupon created successfully', 201);
  } catch (error) {
    console.error('Create auditorium coupon error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, `Validation error: ${validationErrors.join(', ')}`, 400);
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return errorResponse(res, 'Auditorium coupon code already exists', 400);
    }
    
    return errorResponse(res, `Error creating auditorium coupon: ${error.message}`, 500);
  }
};

export const updateAuditoriumCoupon = async (req, res) => {
  try {
    const coupon = await AuditoriumCoupon.findById(req.params.id);
    
    if (!coupon) {
      return errorResponse(res, 'Auditorium coupon not found', 404);
    }

    // Prevent updating code after creation
    const updateData = { ...req.body };
    delete updateData.code;

    // Build populate array dynamically
    const populateOptions = [];
    
    try {
      mongoose.model('User');
      populateOptions.push({ path: 'createdBy', select: 'firstName lastName' });
    } catch (e) {
      console.log('User model not found, skipping createdBy populate');
    }

    try {
      mongoose.model('Category');
      populateOptions.push({ path: 'applicableCategories', select: 'name' });
    } catch (e) {
      console.log('Category model not found, skipping applicableCategories populate');
    }

    try {
      mongoose.model('Store');
      populateOptions.push({ path: 'applicableStores', select: 'storeName' });
    } catch (e) {
      console.log('Store model not found, skipping applicableStores populate');
    }

    let query = AuditoriumCoupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (populateOptions.length > 0) {
      query = query.populate(populateOptions);
    }

    const updatedCoupon = await query;

    return successResponse(res, { coupon: updatedCoupon }, 'Auditorium coupon updated successfully');
  } catch (error) {
    console.error('Update auditorium coupon error:', error);
    return errorResponse(res, 'Error updating auditorium coupon', 500);
  }
};

export const deleteAuditoriumCoupon = async (req, res) => {
  try {
    const coupon = await AuditoriumCoupon.findById(req.params.id);
    
    if (!coupon) {
      return errorResponse(res, 'Auditorium coupon not found', 404);
    }

    await AuditoriumCoupon.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Auditorium coupon deleted successfully');
  } catch (error) {
    console.error('Delete auditorium coupon error:', error);
    return errorResponse(res, 'Error deleting auditorium coupon', 500);
  }
};

export const toggleAuditoriumCouponStatus = async (req, res) => {
  try {
    const coupon = await AuditoriumCoupon.findById(req.params.id);
    
    if (!coupon) {
      return errorResponse(res, 'Auditorium coupon not found', 404);
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return successResponse(res, { coupon }, `Auditorium coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle auditorium coupon status error:', error);
    return errorResponse(res, 'Error updating auditorium coupon status', 500);
  }
};

export const validateAuditoriumCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const now = new Date();

    const coupon = await AuditoriumCoupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      $or: [
        { startDate: { $lte: now }, expireDate: { $gte: now } },
        { startDate: { $exists: false }, expireDate: { $exists: false } },
        { startDate: { $lte: now }, expireDate: { $exists: false } },
        { startDate: { $exists: false }, expireDate: { $gte: now } }
      ]
    });

    if (!coupon) {
      return errorResponse(res, 'Invalid or expired auditorium coupon code', 404);
    }

    if (coupon.totalUses && coupon.usedCount >= coupon.totalUses) {
      return errorResponse(res, 'Auditorium coupon usage limit exceeded', 400);
    }

    return successResponse(res, { coupon }, 'Valid auditorium coupon');
  } catch (error) {
    console.error('Validate auditorium coupon error:', error);
    return errorResponse(res, 'Error validating auditorium coupon', 500);
  }
};

export const applyAuditoriumCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const now = new Date();
    
    // First validate the coupon exists and is usable
    const coupon = await AuditoriumCoupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      $or: [
        { startDate: { $lte: now }, expireDate: { $gte: now } },
        { startDate: { $exists: false }, expireDate: { $exists: false } },
        { startDate: { $lte: now }, expireDate: { $exists: false } },
        { startDate: { $exists: false }, expireDate: { $gte: now } }
      ]
    });

    if (!coupon) {
      return errorResponse(res, 'Invalid or expired auditorium coupon code', 404);
    }

    if (coupon.totalUses && coupon.usedCount >= coupon.totalUses) {
      return errorResponse(res, 'Auditorium coupon usage limit exceeded', 400);
    }

    // Update the usage count
    const updatedCoupon = await AuditoriumCoupon.findByIdAndUpdate(
      coupon._id,
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    return successResponse(res, { coupon: updatedCoupon }, 'Auditorium coupon applied successfully');
  } catch (error) {
    console.error('Apply auditorium coupon error:', error);
    return errorResponse(res, 'Error applying auditorium coupon', 500);
  }
};