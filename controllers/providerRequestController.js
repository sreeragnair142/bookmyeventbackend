import ProviderRequest from '../models/ProviderRequest.js';
import Provider from '../models/Provider.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllProviderRequests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      module,
      zone,
      search 
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (module) filter.module = module;
    if (zone) filter.zone = zone;
    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { ownerFirstName: { $regex: search, $options: 'i' } },
        { ownerLastName: { $regex: search, $options: 'i' } }
      ];
    }

    const requests = await ProviderRequest.find(filter)
      .populate('zone', 'name')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProviderRequest.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { requests }, pagination, 'Provider requests fetched successfully');
  } catch (error) {
    console.error('Get provider requests error:', error);
    return errorResponse(res, 'Error fetching provider requests', 500);
  }
};

export const getProviderRequestById = async (req, res) => {
  try {
    const request = await ProviderRequest.findById(req.params.id)
      .populate('zone', 'name')
      .populate('reviewedBy', 'firstName lastName')
      .populate('approvedProvider');

    if (!request) {
      return errorResponse(res, 'Provider request not found', 404);
    }

    return successResponse(res, { request }, 'Provider request fetched successfully');
  } catch (error) {
    console.error('Get provider request error:', error);
    return errorResponse(res, 'Error fetching provider request', 500);
  }
};

export const createProviderRequest = async (req, res) => {
  try {
    if (!req.files || !req.files.tinCertificate) {
      return errorResponse(res, 'TIN certificate is required', 400);
    }

    const requestData = {
      ...req.body,
      tinCertificate: req.files.tinCertificate[0].path.replace(/\\/g, '/')
    };

    if (req.files.logo) {
      requestData.logo = req.files.logo[0].path.replace(/\\/g, '/');
    }
    
    if (req.files.coverImage) {
      requestData.coverImage = req.files.coverImage[0].path.replace(/\\/g, '/');
    }

    const providerRequest = new ProviderRequest(requestData);
    await providerRequest.save();

    const populatedRequest = await ProviderRequest.findById(providerRequest._id)
      .populate('zone', 'name');

    return successResponse(res, { request: populatedRequest }, 'Provider request submitted successfully', 201);
  } catch (error) {
    console.error('Create provider request error:', error);
    return errorResponse(res, 'Error creating provider request', 500);
  }
};

export const approveProviderRequest = async (req, res) => {
  try {
    const request = await ProviderRequest.findById(req.params.id);
    
    if (!request) {
      return errorResponse(res, 'Provider request not found', 404);
    }

    if (request.status !== 'pending' && request.status !== 'under_review') {
      return errorResponse(res, 'Request has already been processed', 400);
    }

    // Create provider from request
    const providerData = {
      storeName: request.storeName,
      storeAddress: request.storeAddress,
      logo: request.logo,
      coverImage: request.coverImage,
      ownerFirstName: request.ownerFirstName,
      ownerLastName: request.ownerLastName,
      ownerPhone: request.ownerPhone,
      ownerEmail: request.ownerEmail,
      businessTIN: request.businessTIN,
      tinExpireDate: request.tinExpireDate,
      tinCertificate: request.tinCertificate,
      zone: request.zone,
      latitude: request.latitude,
      longitude: request.longitude,
      estimatedDeliveryTime: request.estimatedDeliveryTime,
      isApproved: true,
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    const provider = new Provider(providerData);
    await provider.save();

    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminNotes = req.body.adminNotes;
    request.approvedProvider = provider._id;
    await request.save();

    const populatedRequest = await ProviderRequest.findById(request._id)
      .populate('zone', 'name')
      .populate('reviewedBy', 'firstName lastName')
      .populate('approvedProvider');

    return successResponse(res, { 
      request: populatedRequest,
      provider 
    }, 'Provider request approved successfully');
  } catch (error) {
    console.error('Approve provider request error:', error);
    return errorResponse(res, 'Error approving provider request', 500);
  }
};

export const rejectProviderRequest = async (req, res) => {
  try {
    const request = await ProviderRequest.findById(req.params.id);
    
    if (!request) {
      return errorResponse(res, 'Provider request not found', 404);
    }

    if (request.status !== 'pending' && request.status !== 'under_review') {
      return errorResponse(res, 'Request has already been processed', 400);
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = req.body.rejectionReason;
    request.adminNotes = req.body.adminNotes;
    await request.save();

    const populatedRequest = await ProviderRequest.findById(request._id)
      .populate('zone', 'name')
      .populate('reviewedBy', 'firstName lastName');

    return successResponse(res, { request: populatedRequest }, 'Provider request rejected');
  } catch (error) {
    console.error('Reject provider request error:', error);
    return errorResponse(res, 'Error rejecting provider request', 500);
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await ProviderRequest.findById(req.params.id);
    
    if (!request) {
      return errorResponse(res, 'Provider request not found', 404);
    }

    request.status = status;
    if (status === 'under_review') {
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
    }
    await request.save();

    const populatedRequest = await ProviderRequest.findById(request._id)
      .populate('zone', 'name')
      .populate('reviewedBy', 'firstName lastName');

    return successResponse(res, { request: populatedRequest }, `Request status updated to ${status}`);
  } catch (error) {
    console.error('Update request status error:', error);
    return errorResponse(res, 'Error updating request status', 500);
  }
};

export const getRequestsByModule = async (req, res) => {
  try {
    const { module } = req.params;
    const { status = 'pending' } = req.query;

    const requests = await ProviderRequest.find({ 
      module,
      status 
    })
    .populate('zone', 'name')
    .sort({ createdAt: -1 });

    return successResponse(res, { requests }, `${module} requests fetched successfully`);
  } catch (error) {
    console.error('Get requests by module error:', error);
    return errorResponse(res, 'Error fetching module requests', 500);
  }
};