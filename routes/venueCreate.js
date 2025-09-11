// import express from 'express';
// import { body } from 'express-validator';
// import { authenticate, authorize } from '../middleware/auth.js';
// import { storeUpload, handleMulterError } from '../middleware/upload.js';
// import { validateRequest } from '../utils/validation.js';
// import {
//   getAuditoriums,
//   getAuditorium,
//   createAuditorium,
//   updateAuditorium,
//   deleteAuditorium,
//   getPublicAuditoriums,
//   getPublicAuditorium,
//   getAuditoriumsByZone,
// } from '../controllers/VenueController.js';

// const router = express.Router();

// // Public routes
// router.get('/public', getPublicAuditoriums);
// router.get('/public/:id', getPublicAuditorium);
// router.get('/zone/:zone', getAuditoriumsByZone);

// // Protected routes
// router.get('/', authenticate, getAuditoriums);

// router.get('/:id',
//   authenticate,
//   authorize(['provider', 'admin']),
//   getAuditorium
// );

// router.post('/',
//   authenticate,
//   authorize(['provider']),
//   storeUpload,
//   handleMulterError,
//   [
//     body('storeName')
//       .trim()
//       .notEmpty()
//       .withMessage('Store name is required')
//       .isLength({ max: 100 })
//       .withMessage('Store name must be less than 100 characters'),
    
//     body('storeAddress')
//       .trim()
//       .notEmpty()
//       .withMessage('Store address is required'),

//     body('owner')
//       .custom((value) => {
//         let ownerData;
//         try {
//           ownerData = typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           throw new Error('Owner must be a valid JSON object');
//         }
//         if (!ownerData || !ownerData.firstName || !ownerData.lastName || !ownerData.email || !ownerData.phone) {
//           throw new Error('Owner information (firstName, lastName, email, phone) is required');
//         }
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(ownerData.email)) {
//           throw new Error('Owner email must be valid');
//         }
//         return true;
//       }),

//     body('businessTIN')
//       .trim()
//       .notEmpty()
//       .withMessage('Business TIN is required'),

//     body('tinExpireDate')
//       .notEmpty()
//       .withMessage('TIN expire date is required')
//       .isISO8601()
//       .withMessage('TIN expire date must be a valid date')
//       .custom((value) => {
//         const expireDate = new Date(value);
//         const today = new Date();
//         if (expireDate <= today) {
//           throw new Error('TIN expire date must be in the future');
//         }
//         return true;
//       }),

//     body('zone')
//       .trim()
//       .notEmpty()
//       .withMessage('Zone is required')
//       .isString()
//       .withMessage('Zone must be a string'),

//     body('location')
//       .custom((value) => {
//         let locationData;
//         try {
//           locationData = typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           throw new Error('Location must be a valid JSON object');
//         }
//         if (!locationData || locationData.lat === undefined || locationData.lng === undefined) {
//           throw new Error('Location information (lat, lng) is required');
//         }
//         const lat = Number(locationData.lat);
//         const lng = Number(locationData.lng);
//         if (isNaN(lat) || lat < -90 || lat > 90) {
//           throw new Error('Latitude must be a valid number between -90 and 90');
//         }
//         if (isNaN(lng) || lng < -180 || lng > 180) {
//           throw new Error('Longitude must be a valid number between -180 and 180');
//         }
//         return true;
//       }),

//     body('minimumDeliveryTime')
//       .notEmpty()
//       .withMessage('Minimum delivery time is required')
//       .isInt({ min: 1 })
//       .withMessage('Minimum delivery time must be at least 1'),

//     body('maximumDeliveryTime')
//       .notEmpty()
//       .withMessage('Maximum delivery time is required')
//       .isInt({ min: 1 })
//       .withMessage('Maximum delivery time must be at least 1')
//       .custom((value, { req }) => {
//         const minTime = parseInt(req.body.minimumDeliveryTime);
//         const maxTime = parseInt(value);
//         if (maxTime <= minTime) {
//           throw new Error('Maximum delivery time must be greater than minimum delivery time');
//         }
//         return true;
//       }),

//     body('deliveryTimeUnit')
//       .optional()
//       .isIn(['minutes', 'hours', 'days'])
//       .withMessage('Delivery time unit must be minutes, hours, or days'),

//     body('name')
//       .custom((value) => {
//         let nameObj;
//         try {
//           nameObj = typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           throw new Error('Name must be a valid JSON object');
//         }
//         if (!nameObj || !nameObj.default || nameObj.default.trim().length === 0) {
//           throw new Error('Default name is required');
//         }
//         if (nameObj.default.length > 100) {
//           throw new Error('Default name must be less than 100 characters');
//         }
//         return true;
//       }),

//     body('description')
//       .optional()
//       .custom((value) => {
//         if (!value) return true;
//         const descObj = typeof value === 'string' ? JSON.parse(value) : value;
//         if (descObj && descObj.default && descObj.default.length > 500) {
//           throw new Error('Default description must be less than 500 characters');
//         }
//         return true;
//       }),

//     body('brand')
//       .notEmpty()
//       .withMessage('Brand is required')
//       .isMongoId()
//       .withMessage('Brand must be a valid ID'),

//     body('category')
//       .notEmpty()
//       .withMessage('Category is required')
//       .isMongoId()
//       .withMessage('Category must be a valid ID'),

//     body('model')
//       .trim()
//       .notEmpty()
//       .withMessage('Model is required'),

//     body('type')
//       .isIn(['Family', 'Luxury', 'Executive', 'Compact', 'Affordable'])
//       .withMessage('Invalid venue type'),

//     body('seatingCapacity')
//       .isInt({ min: 1 })
//       .withMessage('Seating capacity must be a positive number'),

//     body('airCondition')
//       .optional()
//       .isBoolean()
//       .withMessage('Air condition must be a boolean'),

//     body('address')
//       .optional()
//       .trim(),

//     body('contact')
//       .custom((value) => {
//         let contactObj;
//         try {
//           contactObj = typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           throw new Error('Contact must be a valid JSON object');
//         }
//         if (!contactObj || !contactObj.phone || !contactObj.email) {
//           throw new Error('Contact phone and email are required');
//         }
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(contactObj.email)) {
//           throw new Error('Contact email must be valid');
//         }
//         return true;
//       }),

//     body('hours')
//       .custom((value) => {
//         let hoursObj;
//         try {
//           hoursObj = typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           throw new Error('Hours must be a valid JSON object');
//         }
//         if (!hoursObj || !hoursObj.opening || !hoursObj.closing) {
//           throw new Error('Opening and closing hours are required');
//         }
//         return true;
//       }),

//     body('pricing')
//       .optional()
//       .custom((value) => {
//         if (!value) return true;
//         const pricingObj = typeof value === 'string' ? JSON.parse(value) : value;
//         if (pricingObj.hourly && (isNaN(pricingObj.hourly) || pricingObj.hourly < 0)) {
//           throw new Error('Hourly pricing must be a positive number');
//         }
//         if (pricingObj.perDay && (isNaN(pricingObj.perDay) || pricingObj.perDay < 0)) {
//           throw new Error('Per day pricing must be a positive number');
//         }
//         return true;
//       }),

//     body('discount')
//       .optional()
//       .isInt({ min: 0, max: 100 })
//       .withMessage('Discount must be between 0 and 100'),

//     body('isActive')
//       .optional()
//       .isBoolean()
//       .withMessage('isActive must be a boolean'),

//     body('isAvailable')
//       .optional()
//       .isBoolean()
//       .withMessage('isAvailable must be a boolean'),

//     body('advancePaymentPercent')
//       .optional()
//       .isInt({ min: 0, max: 100 })
//       .withMessage('Advance payment percent must be between 0 and 100'),

//     body('parking')
//       .optional()
//       .isBoolean()
//       .withMessage('Parking must be a boolean'),
//   ],
//   validateRequest,
//   createAuditorium
// );

// router.put('/:id',
//   authenticate,
//   authorize(['provider']),
//   storeUpload,
//   handleMulterError,
//   [
//     body('storeName')
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage('Store name cannot be empty')
//       .isLength({ max: 100 })
//       .withMessage('Store name must be less than 100 characters'),
    
//     body('storeAddress')
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage('Store address cannot be empty'),

//     body('businessTIN')
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage('Business TIN cannot be empty'),

//     body('tinExpireDate')
//       .optional()
//       .isISO8601()
//       .withMessage('TIN expire date must be a valid date')
//       .custom((value) => {
//         const expireDate = new Date(value);
//         const today = new Date();
//         if (expireDate <= today) {
//           throw new Error('TIN expire date must be in the future');
//         }
//         return true;
//       }),

//     body('zone')
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage('Zone cannot be empty')
//       .isString()
//       .withMessage('Zone must be a string'),

//     body('owner')
//       .optional()
//       .custom((value) => {
//         if (!value) return true;
//         let ownerData;
//         try {
//           ownerData = typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           throw new Error('Owner must be a valid JSON object');
//         }
//         if (ownerData && (!ownerData.firstName || !ownerData.lastName || !ownerData.email || !ownerData.phone)) {
//           throw new Error('Owner information (firstName, lastName, email, phone) is required');
//         }
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (ownerData && ownerData.email && !emailRegex.test(ownerData.email)) {
//           throw new Error('Owner email must be valid');
//         }
//         return true;
//       }),

//     body('location')
//       .optional()
//       .custom((value) => {
//         if (!value) return true;
//         let locationData;
//         try {
//           locationData = typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           throw new Error('Location must be a valid JSON object');
//         }
//         if (locationData && (locationData.lat === undefined || locationData.lng === undefined)) {
//           throw new Error('Location information (lat, lng) is required');
//         }
//         const lat = Number(locationData.lat);
//         const lng = Number(locationData.lng);
//         if (locationData && (isNaN(lat) || lat < -90 || lat > 90)) {
//           throw new Error('Latitude must be a valid number between -90 and 90');
//         }
//         if (locationData && (isNaN(lng) || lng < -180 || lng > 180)) {
//           throw new Error('Longitude must be a valid number between -180 and 180');
//         }
//         return true;
//       }),

//     body('minimumDeliveryTime')
//       .optional()
//       .isInt({ min: 1 })
//       .withMessage('Minimum delivery time must be at least 1'),

//     body('maximumDeliveryTime')
//       .optional()
//       .isInt({ min: 1 })
//       .withMessage('Maximum delivery time must be at least 1'),

//     body('name')
//       .optional()
//       .custom((value) => {
//         if (!value) return true;
//         let nameObj;
//         try {
//           nameObj = typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           throw new Error('Name must be a valid JSON object');
//         }
//         if (nameObj && nameObj.default && nameObj.default.length > 100) {
//           throw new Error('Default name must be less than 100 characters');
//         }
//         return true;
//       }),

//     body('description')
//       .optional()
//       .custom((value) => {
//         if (!value) return true;
//         const descObj = typeof value === 'string' ? JSON.parse(value) : value;
//         if (descObj && descObj.default && descObj.default.length > 500) {
//           throw new Error('Default description must be less than 500 characters');
//         }
//         return true;
//       }),

//     body('brand')
//       .optional()
//       .isMongoId()
//       .withMessage('Brand must be a valid ID'),

//     body('category')
//       .optional()
//       .isMongoId()
//       .withMessage('Category must be a valid ID'),

//     body('model')
//       .optional()
//       .trim()
//       .notEmpty()
//       .withMessage('Model cannot be empty'),

//     body('type')
//       .optional()
//       .isIn(['Family', 'Luxury', 'Executive', 'Compact', 'Affordable'])
//       .withMessage('Invalid venue type'),

//     body('seatingCapacity')
//       .optional()
//       .isInt({ min: 1 })
//       .withMessage('Seating capacity must be a positive number'),

//     body('airCondition')
//       .optional()
//       .isBoolean()
//       .withMessage('Air condition must be a boolean'),

//     body('discount')
//       .optional()
//       .isInt({ min: 0, max: 100 })
//       .withMessage('Discount must be between 0 and 100'),

//     body('isActive')
//       .optional()
//       .isBoolean()
//       .withMessage('isActive must be a boolean'),

//     body('isAvailable')
//       .optional()
//       .isBoolean()
//       .withMessage('isAvailable must be a boolean'),

//     body('advancePaymentPercent')
//       .optional()
//       .isInt({ min: 0, max: 100 })
//       .withMessage('Advance payment percent must be between 0 and 100'),

//     body('parking')
//       .optional()
//       .isBoolean()
//       .withMessage('Parking must be a boolean'),
//   ],
//   validateRequest,
//   updateAuditorium
// );

// router.delete('/:id',
//   authenticate,
//   authorize(['provider']),
//   deleteAuditorium
// );

// export default router;

// routes/venueRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directories exist
const uploadDirs = [
  'Uploads/thumbnails',
  'Uploads/vehicle-images', 
  'Uploads/general',
  'Uploads/documents'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'Uploads/';
    
    if (file.fieldname === 'thumbnail') {
      uploadPath += 'thumbnails/';
    } else if (file.fieldname === 'images') {
      uploadPath += 'vehicle-images/';
    } else if (file.fieldname === 'floorPlan') {
      uploadPath += 'general/';
    } else if (file.fieldname === 'documents') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'general/';
    }
    
    const fullPath = path.join(__dirname, '..', uploadPath);
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Define allowed file types for each field
    const allowedTypes = {
      thumbnail: /jpeg|jpg|png/,
      images: /jpeg|jpg|png/,
      floorPlan: /jpeg|jpg|png|pdf/,
      documents: /pdf|doc|docx|jpeg|jpg|png/
    };

    const fileTypes = allowedTypes[file.fieldname] || /jpeg|jpg|png|pdf|doc|docx/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}`));
    }
  }
});

// Venue Schema
const venueSchema = new mongoose.Schema({
  venueName: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  venueAddress: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  language: {
    type: String,
    default: 'EN'
  },
  thumbnail: {
    type: String
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactWebsite: {
    type: String
  },
  ownerManagerName: {
    type: String,
    required: true
  },
  ownerManagerPhone: {
    type: String
  },
  ownerManagerEmail: {
    type: String
  },
  openingHours: {
    type: String,
    required: true
  },
  closingHours: {
    type: String,
    required: true
  },
  holidaySchedule: {
    type: String
  },
  images: [{
    type: String
  }],
  watermarkProtection: {
    type: Boolean,
    default: false
  },
  facilities: {
    parkingAvailability: {
      type: Boolean,
      default: false
    },
    parkingCapacity: {
      type: Number,
      min: 0
    },
    foodCateringAvailability: {
      type: Boolean,
      default: false
    },
    stageLightingAudio: {
      type: Boolean,
      default: false
    },
    wheelchairAccessibility: {
      type: Boolean,
      default: false
    },
    securityArrangements: {
      type: Boolean,
      default: false
    },
    wifiAvailability: {
      type: Boolean,
      default: false
    },
    washroomsInfo: {
      type: String,
      trim: true
    },
    dressingRooms: {
      type: String,
      trim: true
    }
  },
  rentalType: {
    type: String,
    enum: ['hourly', 'perDay', 'distanceWise'],
    required: true
  },
  hourlyPrice: {
    type: Number,
    min: 0
  },
  perDayPrice: {
    type: Number,
    min: 0
  },
  distanceWisePrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100
  },
  customPackages: {
    type: String,
    trim: true
  },
  dynamicPricing: {
    type: Boolean,
    default: false
  },
  advanceDeposit: {
    type: Number,
    min: 0,
    max: 100
  },
  cancellationPolicy: [{
    type: String,
    trim: true
  }],
  extraCharges: {
    type: String,
    trim: true
  },
  seatingArrangement: {
    type: String,
    required: true
  },
  maxGuestsSeated: {
    type: Number,
    min: 0
  },
  maxGuestsStanding: {
    type: Number,
    min: 0
  },
  floorPlan: {
    type: String
  },
  multipleHalls: {
    type: Boolean,
    default: false
  },
  nearbyTransport: {
    type: String,
    trim: true
  },
  accessibilityInfo: {
    type: String,
    trim: true
  },
  documents: [{
    type: String
  }],
  searchTags: [{
    type: String,
    trim: true
  }],
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create the model
const Venue = mongoose.model('Venue', venueSchema);

// GET /api/createvenue - Fetch venues with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.provider) {
      filter.provider = req.query.provider;
    }
    if (req.query.rentalType) {
      filter.rentalType = req.query.rentalType;
    }
    if (req.query.search) {
      filter.$or = [
        { venueName: { $regex: req.query.search, $options: 'i' } },
        { venueAddress: { $regex: req.query.search, $options: 'i' } },
        { searchTags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Fetch venues with pagination
    const venues = await Venue.find(filter)
      .populate('provider', 'storeName ownerFirstName ownerLastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalItems = await Venue.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      message: 'Venues fetched successfully',
      data: {
        venues
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venues',
      error: error.message
    });
  }
});

// GET /api/createvenue/:id - Fetch single venue
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid venue ID'
      });
    }

    const venue = await Venue.findById(id)
      .populate('provider', 'storeName ownerFirstName ownerLastName')
      .lean();

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Venue fetched successfully',
      data: { venue },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venue',
      error: error.message
    });
  }
});

// POST /api/createvenue - Create new venue
router.post('/', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'floorPlan', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      venueName,
      shortDescription,
      venueAddress,
      latitude,
      longitude,
      language,
      contactPhone,
      contactEmail,
      contactWebsite,
      ownerManagerName,
      ownerManagerPhone,
      ownerManagerEmail,
      openingHours,
      closingHours,
      holidaySchedule,
      watermarkProtection,
      rentalType,
      hourlyPrice,
      perDayPrice,
      distanceWisePrice,
      discount,
      customPackages,
      dynamicPricing,
      advanceDeposit,
      cancellationPolicy,
      extraCharges,
      seatingArrangement,
      maxGuestsSeated,
      maxGuestsStanding,
      multipleHalls,
      nearbyTransport,
      accessibilityInfo,
      searchTags,
      provider,
      facilities
    } = req.body;

    // Validate required fields
    if (!venueName || !venueAddress || !contactPhone || !contactEmail || 
        !ownerManagerName || !openingHours || !closingHours || 
        !seatingArrangement || !provider) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate provider exists
    if (!mongoose.Types.ObjectId.isValid(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider ID'
      });
    }

    // Process file uploads
    const filePaths = {};
    if (req.files) {
      if (req.files.thumbnail) {
        filePaths.thumbnail = req.files.thumbnail[0].path.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/');
      }
      if (req.files.images) {
        filePaths.images = req.files.images.map(file => 
          file.path.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/')
        );
      }
      if (req.files.floorPlan) {
        filePaths.floorPlan = req.files.floorPlan[0].path.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/');
      }
      if (req.files.documents) {
        filePaths.documents = req.files.documents.map(file => 
          file.path.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/')
        );
      }
    }

    // Parse facilities from req.body
    const parsedFacilities = {};
    if (facilities) {
      ['parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
        if (facilities[field] !== undefined) {
          parsedFacilities[field] = facilities[field] === 'true' || facilities[field] === '1' || facilities[field] === 'yes';
        }
      });
      if (facilities.parkingCapacity !== undefined) {
        parsedFacilities.parkingCapacity = parseInt(facilities.parkingCapacity);
      }
      if (facilities.washroomsInfo) parsedFacilities.washroomsInfo = facilities.washroomsInfo;
      if (facilities.dressingRooms) parsedFacilities.dressingRooms = facilities.dressingRooms;
    }

    // Create venue object
    const venueData = {
      venueName,
      shortDescription,
      venueAddress,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      language: language || 'EN',
      contactPhone,
      contactEmail,
      contactWebsite,
      ownerManagerName,
      ownerManagerPhone,
      ownerManagerEmail,
      openingHours,
      closingHours,
      holidaySchedule,
      watermarkProtection: watermarkProtection === 'true' || watermarkProtection === '1' || watermarkProtection === 'yes',
      facilities: parsedFacilities,
      rentalType,
      hourlyPrice: hourlyPrice ? parseFloat(hourlyPrice) : undefined,
      perDayPrice: perDayPrice ? parseFloat(perDayPrice) : undefined,
      distanceWisePrice: distanceWisePrice ? parseFloat(distanceWisePrice) : undefined,
      discount: discount ? parseFloat(discount) : undefined,
      customPackages,
      dynamicPricing: dynamicPricing === 'true' || dynamicPricing === '1' || dynamicPricing === 'yes',
      advanceDeposit: advanceDeposit ? parseFloat(advanceDeposit) : undefined,
      cancellationPolicy: cancellationPolicy ? (typeof cancellationPolicy === 'string' ? cancellationPolicy.split(',').map(policy => policy.trim()) : cancellationPolicy) : [],
      extraCharges,
      seatingArrangement,
      maxGuestsSeated: maxGuestsSeated ? parseInt(maxGuestsSeated) : undefined,
      maxGuestsStanding: maxGuestsStanding ? parseInt(maxGuestsStanding) : undefined,
      multipleHalls: multipleHalls === 'true' || multipleHalls === '1' || multipleHalls === 'yes',
      nearbyTransport,
      accessibilityInfo,
      searchTags: searchTags ? (typeof searchTags === 'string' ? searchTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : searchTags) : [],
      provider,
      ...filePaths
    };

    // Create venue
    const venue = new Venue(venueData);
    const savedVenue = await venue.save();

    // Populate provider info for response
    const populatedVenue = await Venue.findById(savedVenue._id)
      .populate('provider', 'storeName ownerFirstName ownerLastName')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: { venue: populatedVenue },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating venue:', error);
    
    // Clean up uploaded files if venue creation fails
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating venue',
      error: error.message
    });
  }
});

// PUT /api/createvenue/:id - Update venue
router.put('/:id', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'floorPlan', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid venue ID'
      });
    }

    const existingVenue = await Venue.findById(id);
    if (!existingVenue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Process the update similar to create, but merge with existing data
    const updateData = { ...req.body };

    // Process file uploads
    if (req.files) {
      if (req.files.thumbnail) {
        updateData.thumbnail = req.files.thumbnail[0].path.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/');
      }
      if (req.files.images) {
        updateData.images = [...(existingVenue.images || []), ...req.files.images.map(file => file.path.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/'))];
      }
      if (req.files.floorPlan) {
        updateData.floorPlan = req.files.floorPlan[0].path.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/');
      }
      if (req.files.documents) {
        updateData.documents = [...(existingVenue.documents || []), ...req.files.documents.map(file => file.path.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/'))];
      }
    }

    // Parse facilities from req.body
    const parsedFacilities = { ...existingVenue.facilities };
    if (updateData.facilities) {
      ['parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
        if (updateData.facilities[field] !== undefined) {
          parsedFacilities[field] = updateData.facilities[field] === 'true' || updateData.facilities[field] === '1' || updateData.facilities[field] === 'yes';
        }
      });
      if (updateData.facilities.parkingCapacity !== undefined) {
        parsedFacilities.parkingCapacity = parseInt(updateData.facilities.parkingCapacity);
      }
      if (updateData.facilities.washroomsInfo) parsedFacilities.washroomsInfo = updateData.facilities.washroomsInfo;
      if (updateData.facilities.dressingRooms) parsedFacilities.dressingRooms = updateData.facilities.dressingRooms;
      updateData.facilities = parsedFacilities;
    }

    // Parse boolean fields
    ['watermarkProtection', 'dynamicPricing', 'multipleHalls'].forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = updateData[field] === 'true' || updateData[field] === '1' || updateData[field] === 'yes';
      }
    });

    // Parse numeric fields
    ['latitude', 'longitude', 'hourlyPrice', 'perDayPrice', 'distanceWisePrice', 'discount', 'advanceDeposit', 'maxGuestsSeated', 'maxGuestsStanding', 'parkingCapacity'].forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = parseFloat(updateData[field]) || parseInt(updateData[field]);
      }
    });

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updatedVenue = await Venue.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    }).populate('provider', 'storeName ownerFirstName ownerLastName');

    res.status(200).json({
      success: true,
      message: 'Venue updated successfully',
      data: { venue: updatedVenue },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating venue',
      error: error.message
    });
  }
});

// DELETE /api/createvenue/:id - Delete venue
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid venue ID'
      });
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Delete associated files
    const filesToDelete = [];
    if (venue.thumbnail) filesToDelete.push(venue.thumbnail);
    if (venue.images) filesToDelete.push(...venue.images);
    if (venue.floorPlan) filesToDelete.push(venue.floorPlan);
    if (venue.documents) filesToDelete.push(...venue.documents);

    filesToDelete.forEach(filePath => {
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await Venue.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Venue deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting venue',
      error: error.message
    });
  }
});

// PATCH /api/createvenue/:id/status - Toggle venue active status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid venue ID'
      });
    }

    const venue = await Venue.findByIdAndUpdate(
      id, 
      { isActive: isActive !== undefined ? (isActive === 'true' || isActive === '1' || isActive === 'yes') : !venue?.isActive },
      { new: true }
    ).populate('provider', 'storeName ownerFirstName ownerLastName');

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Venue ${venue.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { venue },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating venue status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating venue status',
      error: error.message
    });
  }
});

export default router;