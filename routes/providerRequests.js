import express from 'express';
import { body } from 'express-validator';
import ProviderRequest from '../models/ProviderRequest.js';
import Provider from '../models/Provider.js';
import { authenticate, authorize } from '../middleware/auth.js';
import upload, { handleMulterError } from '../middleware/upload.js';
import { validateRequest } from '../utils/validation.js';

const router = express.Router();

// Get all provider requests
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
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

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get provider requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provider requests'
    });
  }
});

// Get provider request by ID
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const request = await ProviderRequest.findById(req.params.id)
      .populate('zone', 'name')
      .populate('reviewedBy', 'firstName lastName')
      .populate('approvedProvider');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Provider request not found'
      });
    }

    res.json({
      success: true,
      data: { request }
    });
  } catch (error) {
    console.error('Get provider request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provider request'
    });
  }
});

// Create new provider request
router.post('/', 
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'tinCertificate', maxCount: 1 }
  ]),
  handleMulterError,
  [
    body('storeName').trim().isLength({ min: 1, max: 100 }).withMessage('Store name is required and must be 1-100 characters'),
    body('storeAddress').trim().isLength({ min: 1 }).withMessage('Store address is required'),
    body('ownerFirstName').trim().isLength({ min: 1, max: 50 }).withMessage('Owner first name is required'),
    body('ownerLastName').trim().isLength({ min: 1, max: 50 }).withMessage('Owner last name is required'),
    body('ownerPhone').trim().isLength({ min: 1 }).withMessage('Owner phone is required'),
    body('ownerEmail').isEmail().withMessage('Valid email is required'),
    body('businessTIN').trim().isLength({ min: 1 }).withMessage('Business TIN is required'),
    body('tinExpireDate').isISO8601().withMessage('Valid TIN expire date is required'),
    body('module').isIn(['restaurant', 'grocery', 'pharmacy', 'electronics', 'fashion']).withMessage('Invalid module'),
    body('zone').isMongoId().withMessage('Valid zone ID is required'),
    body('latitude').isNumeric().withMessage('Valid latitude is required'),
    body('longitude').isNumeric().withMessage('Valid longitude is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      if (!req.files || !req.files.tinCertificate) {
        return res.status(400).json({
          success: false,
          message: 'TIN certificate is required'
        });
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

      res.status(201).json({
        success: true,
        message: 'Provider request submitted successfully',
        data: { request: populatedRequest }
      });
    } catch (error) {
      console.error('Create provider request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating provider request'
      });
    }
  }
);

// Approve provider request
router.patch('/:id/approve', 
  authenticate, 
  authorize('admin', 'manager'),
  [
    body('adminNotes').optional().trim().isLength({ max: 500 }).withMessage('Admin notes cannot exceed 500 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const request = await ProviderRequest.findById(req.params.id);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Provider request not found'
        });
      }

      if (request.status !== 'pending' && request.status !== 'under_review') {
        return res.status(400).json({
          success: false,
          message: 'Request has already been processed'
        });
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

      res.json({
        success: true,
        message: 'Provider request approved successfully',
        data: { 
          request: populatedRequest,
          provider 
        }
      });
    } catch (error) {
      console.error('Approve provider request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error approving provider request'
      });
    }
  }
);

// Reject provider request
router.patch('/:id/reject', 
  authenticate, 
  authorize('admin', 'manager'),
  [
    body('rejectionReason').trim().isLength({ min: 1, max: 500 }).withMessage('Rejection reason is required and must be 1-500 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const request = await ProviderRequest.findById(req.params.id);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Provider request not found'
        });
      }

      if (request.status !== 'pending' && request.status !== 'under_review') {
        return res.status(400).json({
          success: false,
          message: 'Request has already been processed'
        });
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

      res.json({
        success: true,
        message: 'Provider request rejected',
        data: { request: populatedRequest }
      });
    } catch (error) {
      console.error('Reject provider request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error rejecting provider request'
      });
    }
  }
);

export default router;