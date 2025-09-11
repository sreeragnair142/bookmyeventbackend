// // import mongoose from 'mongoose';

// // const AuditoriumSchema = new mongoose.Schema(
// //   {
// //     storeName: {
// //       type: String,
// //       required: [true, 'Store name is required'],
// //       trim: true,
// //       maxlength: [100, 'Store name cannot be more than 100 characters'],
// //     },
// //     storeAddress: {
// //       type: String,
// //       required: [true, 'Store address is required'],
// //       trim: true,
// //     },
// //     owner: {
// //       firstName: {
// //         type: String,
// //         required: [true, 'Owner first name is required'],
// //         trim: true,
// //       },
// //       lastName: {
// //         type: String,
// //         required: [true, 'Owner last name is required'],
// //         trim: true,
// //       },
// //       phone: {
// //         type: String,
// //         required: [true, 'Owner phone is required'],
// //         trim: true,
// //       },
// //       email: {
// //         type: String,
// //         required: [true, 'Owner email is required'],
// //         trim: true,
// //         lowercase: true,
// //         match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Owner email must be valid'],
// //       },
// //     },
// //     businessTIN: {
// //       type: String,
// //       required: [true, 'Business TIN is required'],
// //       trim: true,
// //       unique: true,
// //     },
// //     tinExpireDate: {
// //       type: Date,
// //       required: [true, 'TIN expire date is required'],
// //     },
// //     tinCertificate: {
// //       type: String,
// //       required: [true, 'TIN certificate is required'],
// //     },
// //     zone: {
// //       type: String,
// //       required: [true, 'Zone is required'],
// //       trim: true,
// //     },
// //     location: {
// //       lat: {
// //         type: Number,
// //         required: [true, 'Latitude is required'],
// //         min: [-90, 'Latitude must be between -90 and 90'],
// //         max: [90, 'Latitude must be between -90 and 90'],
// //       },
// //       lng: {
// //         type: Number,
// //         required: [true, 'Longitude is required'],
// //         min: [-180, 'Longitude must be between -180 and 180'],
// //         max: [180, 'Longitude must be between -180 and 180'],
// //       },
// //     },
// //     minimumDeliveryTime: {
// //       type: Number,
// //       required: [true, 'Minimum delivery time is required'],
// //       min: [1, 'Minimum delivery time must be at least 1'],
// //     },
// //     maximumDeliveryTime: {
// //       type: Number,
// //       required: [true, 'Maximum delivery time is required'],
// //       min: [1, 'Maximum delivery time must be at least 1'],
// //     },
// //     deliveryTimeUnit: {
// //       type: String,
// //       enum: ['minutes', 'hours', 'days'],
// //       default: 'hours',
// //     },
// //     name: {
// //       default: {
// //         type: String,
// //         required: [true, 'Please add a venue name'],
// //         trim: true,
// //         maxlength: [100, 'Name cannot be more than 100 characters'],
// //       },
// //       en: { type: String, trim: true, maxlength: 100 },
// //       ar: { type: String, trim: true, maxlength: 100 },
// //     },
// //     description: {
// //       default: { type: String, trim: true, maxlength: 500 },
// //       en: { type: String, trim: true, maxlength: 500 },
// //       ar: { type: String, trim: true, maxlength: 500 },
// //     },
// //     brand: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'Brand',
// //       required: [true, 'Please select a brand'],
// //     },
// //     category: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'Category',
// //       required: [true, 'Please select a category'],
// //     },
// //     categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
// //     model: {
// //       type: String,
// //       required: [true, 'Please add a model'],
// //       trim: true,
// //     },
// //     type: {
// //       type: String,
// //       required: [true, 'Please select venue type'],
// //       enum: ['Family', 'Luxury', 'Executive', 'Compact', 'Affordable'],
// //     },
// //     seatingCapacity: { type: Number, required: true },
// //     airCondition: { type: Boolean, default: true },
// //     address: { type: String, trim: true },
// //     contact: {
// //       phone: { type: String, required: true, trim: true },
// //       email: {
// //         type: String,
// //         required: true,
// //         trim: true,
// //         match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Contact email must be valid'],
// //       },
// //       website: { type: String, trim: true },
// //     },
// //     hours: {
// //       opening: { type: String, required: true, trim: true },
// //       closing: { type: String, required: true, trim: true },
// //       holiday: { type: String, trim: true },
// //     },
// //     thumbnail: { type: String },
// //     images: [{ type: String }],
// //     floorPlan: { type: String },
// //     documents: [{ type: String }],
// //     watermarkProtection: { type: Boolean, default: false },
// //     facilities: {
// //       parking: {
// //         available: { type: Boolean, default: false },
// //         capacity: { type: Number },
// //       },
// //       foodCatering: { type: Boolean, default: false },
// //       stageLightingAudio: { type: Boolean, default: false },
// //       wheelchairAccessibility: { type: Boolean, default: false },
// //       securityArrangements: { type: Boolean, default: false },
// //       wifiAvailability: { type: Boolean, default: false },
// //       washroomsInfo: { type: String, trim: true },
// //       dressingRooms: { type: Boolean, default: false },
// //     },
// //     pricing: {
// //       hourly: { type: Number, default: 0 },
// //       perDay: { type: Number, default: 0 },
// //       distanceWise: { type: Number, default: 0 },
// //     },
// //     discount: { type: Number, default: 0, min: 0, max: 100 },
// //     customPackages: { type: String, trim: true },
// //     dynamicPricing: { type: Boolean, default: false },
// //     advancePaymentPercent: { type: Number, min: 0, max: 100 },
// //     cancellationPolicy: { type: String, trim: true },
// //     extraCharges: { type: String, trim: true },
// //     capacity: [
// //       {
// //         hall: { type: String, required: true },
// //         seats: { type: Number, required: true },
// //       },
// //     ],
// //     seatingArrangement: {
// //       type: String,
// //       enum: ['Theater', 'Banquet', 'Classroom'],
// //     },
// //     maxGuestCountSeated: { type: Number },
// //     maxGuestCountStanding: { type: Number },
// //     multipleHalls: { type: Boolean, default: false },
// //     nearbyTransport: { type: String, trim: true },
// //     elderlyAccessibility: { type: Boolean, default: false },
// //     searchTags: [{ type: String, trim: true }],
// //     isActive: { type: Boolean, default: true },
// //     isAvailable: { type: Boolean, default: true },
// //     isFeatured: { type: Boolean, default: false },
// //     isApproved: { type: Boolean, default: false },
// //     totalEvents: { type: Number, default: 0 },
// //     rating: { type: Number, default: 0 },
// //     averageRating: { type: Number, default: 0 },
// //     totalReviews: { type: Number, default: 0 },
// //     provider: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'User',
// //       required: true,
// //     },
// //     // Remove redundant fields if they are not needed
// //     ownerFirstName: { type: String, trim: true }, // Check if this is needed, as `owner` already exists
// //     ownerLastName: { type: String, trim: true },
// //     ownerPhone: { type: String, trim: true },
// //     ownerEmail: { type: String, trim: true },
// //     latitude: { type: Number }, // Check if this is needed, as `location.lat` exists
// //     longitude: { type: Number }, // Check if this is needed, as `location.lng` exists
// //   },
// //   {
// //     timestamps: true,
// //     strictPopulate: false,
// //   }
// // );

// // // Validation: max > min delivery time
// // AuditoriumSchema.pre('validate', function (next) {
// //   if (this.maximumDeliveryTime && this.minimumDeliveryTime) {
// //     if (this.maximumDeliveryTime <= this.minimumDeliveryTime) {
// //       this.invalidate(
// //         'maximumDeliveryTime',
// //         'Maximum delivery time must be greater than minimum delivery time'
// //       );
// //     }
// //   }
// //   next();
// // });

// // // Indexes (ensure no duplicates)
// // AuditoriumSchema.index({ provider: 1, isActive: 1 });
// // AuditoriumSchema.index({ brand: 1, category: 1 });
// // AuditoriumSchema.index({ isAvailable: 1, createdAt: -1 });
// // AuditoriumSchema.index({ zone: 1, isActive: 1 });
// // AuditoriumSchema.index({ 'name.default': 'text', searchTags: 'text' });
// // AuditoriumSchema.index({ 'location.lat': 1, 'location.lng': 1 });
// // AuditoriumSchema.index({ businessTIN: 1 }, { unique: true });

// // // Prevent redefinition of the model
// // const Auditorium =
// //   mongoose.models.Auditorium || mongoose.model('Auditorium', AuditoriumSchema);

// // export default Auditorium;



// // controllers/VenueController.js
// import Venue from '../models/Venue.js';
// import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

// export const getAllVenues = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 10, 
//       providerId, 
//       isActive,
//       search 
//     } = req.query;

//     const filter = {};
//     if (providerId) filter.provider = providerId;
//     if (isActive !== undefined) filter.isActive = isActive === 'true';
//     if (search) {
//       filter.$or = [
//         { venueName: { $regex: search, $options: 'i' } },
//         { venueAddress: { $regex: search, $options: 'i' } },
//         { ownerManagerName: { $regex: search, $options: 'i' } }
//       ];
//     }

//     const venues = await Venue.find(filter)
//       .populate('provider', 'storeName ownerFirstName ownerLastName')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Venue.countDocuments(filter);

//     const pagination = {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       itemsPerPage: parseInt(limit)
//     };

//     return paginatedResponse(res, { venues }, pagination, 'Venues fetched successfully');
//   } catch (error) {
//     console.error('Get venues error:', error);
//     return errorResponse(res, 'Error fetching venues', 500);
//   }
// };

// export const getVenueById = async (req, res) => {
//   try {
//     const venue = await Venue.findById(req.params.id)
//       .populate('provider', 'storeName ownerFirstName ownerLastName');

//     if (!venue) {
//       return errorResponse(res, 'Venue not found', 404);
//     }

//     return successResponse(res, { venue }, 'Venue fetched successfully');
//   } catch (error) {
//     console.error('Get venue error:', error);
//     return errorResponse(res, 'Error fetching venue', 500);
//   }
// };

// export const createVenue = async (req, res) => {
//   try {
//     const venueData = { ...req.body };

//     // Handle file uploads
//     if (req.files) {
//       if (req.files.thumbnail) {
//         venueData.thumbnail = req.files.thumbnail[0].path.replace(/\\/g, '/');
//       }
//       if (req.files.images) {
//         venueData.images = req.files.images.map(file => file.path.replace(/\\/g, '/'));
//       }
//       if (req.files.floorPlan) {
//         venueData.floorPlan = req.files.floorPlan[0].path.replace(/\\/g, '/');
//       }
//       if (req.files.documents) {
//         venueData.documents = req.files.documents.map(file => file.path.replace(/\\/g, '/'));
//       }
//     }

//     // Safe parsing for numbers and booleans
//     const safeParseInt = (value) => {
//       if (value === undefined || value === null || value === "") return undefined;
//       const parsed = parseInt(value, 10);
//       return isNaN(parsed) ? undefined : parsed;
//     };

//     const safeParseFloat = (value) => {
//       if (value === undefined || value === null || value === "") return undefined;
//       const parsed = parseFloat(value);
//       return isNaN(parsed) ? undefined : parsed;
//     };

//     const safeParseBoolean = (value) => {
//       if (value === undefined || value === null) return undefined;
//       const stringValue = String(value).toLowerCase().trim();
//       if (stringValue === "true" || stringValue === "1" || stringValue === "yes") return true;
//       if (stringValue === "false" || stringValue === "0" || stringValue === "no") return false;
//       return undefined;
//     };

//     // Parse numeric fields
//     ['latitude', 'longitude', 'hourlyPrice', 'perDayPrice', 'distanceWisePrice', 'discount', 'advanceDeposit', 'maxGuestsSeated', 'maxGuestsStanding', 'parkingCapacity'].forEach(field => {
//       if (venueData[field] !== undefined) {
//         venueData[field] = safeParseFloat(venueData[field]) || safeParseInt(venueData[field]);
//       }
//     });

//     // Parse boolean fields
//     ['watermarkProtection', 'dynamicPricing', 'multipleHalls', 'parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
//       if (venueData[field] !== undefined) {
//         venueData[field] = safeParseBoolean(venueData[field]);
//       }
//     });

//     // Handle facilities object
//     if (venueData.facilities) {
//       ['parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
//         if (venueData.facilities[field] !== undefined) {
//           venueData.facilities[field] = safeParseBoolean(venueData.facilities[field]);
//         }
//       });
//       if (venueData.facilities.parkingCapacity !== undefined) {
//         venueData.facilities.parkingCapacity = safeParseInt(venueData.facilities.parkingCapacity);
//       }
//     }

//     // Set defaults
//     venueData.isActive = venueData.isActive ?? true;
//     venueData.language = venueData.language ?? 'EN';
//     venueData.rentalType = venueData.rentalType ?? 'hourly';

//     const venue = new Venue(venueData);
//     await venue.save();

//     const populatedVenue = await Venue.findById(venue._id).populate('provider', 'storeName ownerFirstName ownerLastName');

//     return successResponse(res, { venue: populatedVenue }, 'Venue created successfully', 201);
//   } catch (error) {
//     console.error('Create venue error:', error);
//     return errorResponse(res, 'Error creating venue', 500);
//   }
// };

// export const updateVenue = async (req, res) => {
//   try {
//     const venue = await Venue.findById(req.params.id);
//     if (!venue) {
//       return errorResponse(res, 'Venue not found', 404);
//     }

//     const updateData = { ...req.body };

//     // Handle file uploads (update existing)
//     if (req.files) {
//       if (req.files.thumbnail) {
//         updateData.thumbnail = req.files.thumbnail[0].path.replace(/\\/g, '/');
//       }
//       if (req.files.images) {
//         updateData.images = [...(venue.images || []), ...req.files.images.map(file => file.path.replace(/\\/g, '/'))];
//       }
//       if (req.files.floorPlan) {
//         updateData.floorPlan = req.files.floorPlan[0].path.replace(/\\/g, '/');
//       }
//       if (req.files.documents) {
//         updateData.documents = [...(venue.documents || []), ...req.files.documents.map(file => file.path.replace(/\\/g, '/'))];
//       }
//     }

//     // Reuse safe parsing from create
//     const safeParseInt = (value) => {
//       if (value === undefined || value === null || value === "") return undefined;
//       const parsed = parseInt(value, 10);
//       return isNaN(parsed) ? undefined : parsed;
//     };

//     const safeParseFloat = (value) => {
//       if (value === undefined || value === null || value === "") return undefined;
//       const parsed = parseFloat(value);
//       return isNaN(parsed) ? undefined : parsed;
//     };

//     const safeParseBoolean = (value) => {
//       if (value === undefined || value === null) return undefined;
//       const stringValue = String(value).toLowerCase().trim();
//       if (stringValue === "true" || stringValue === "1" || stringValue === "yes") return true;
//       if (stringValue === "false" || stringValue === "0" || stringValue === "no") return false;
//       return undefined;
//     };

//     // Parse numeric fields
//     ['latitude', 'longitude', 'hourlyPrice', 'perDayPrice', 'distanceWisePrice', 'discount', 'advanceDeposit', 'maxGuestsSeated', 'maxGuestsStanding', 'parkingCapacity'].forEach(field => {
//       if (updateData[field] !== undefined) {
//         updateData[field] = safeParseFloat(updateData[field]) || safeParseInt(updateData[field]);
//       }
//     });

//     // Parse boolean fields
//     ['watermarkProtection', 'dynamicPricing', 'multipleHalls', 'parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
//       if (updateData[field] !== undefined) {
//         updateData[field] = safeParseBoolean(updateData[field]);
//       }
//     });

//     // Handle facilities object
//     if (updateData.facilities) {
//       ['parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
//         if (updateData.facilities[field] !== undefined) {
//           updateData.facilities[field] = safeParseBoolean(updateData.facilities[field]);
//         }
//       });
//       if (updateData.facilities.parkingCapacity !== undefined) {
//         updateData.facilities.parkingCapacity = safeParseInt(updateData.facilities.parkingCapacity);
//       }
//     }

//     // Remove undefined values
//     Object.keys(updateData).forEach(key => {
//       if (updateData[key] === undefined) delete updateData[key];
//     });

//     const updatedVenue = await Venue.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     ).populate('provider', 'storeName ownerFirstName ownerLastName');

//     return successResponse(res, { venue: updatedVenue }, 'Venue updated successfully');
//   } catch (error) {
//     console.error('Update venue error:', error);
//     return errorResponse(res, 'Error updating venue', 500);
//   }
// };

// export const toggleVenueStatus = async (req, res) => {
//   try {
//     const venue = await Venue.findById(req.params.id);
    
//     if (!venue) {
//       return errorResponse(res, 'Venue not found', 404);
//     }

//     venue.isActive = !venue.isActive;
//     await venue.save();

//     return successResponse(res, { venue }, `Venue ${venue.isActive ? 'activated' : 'deactivated'} successfully`);
//   } catch (error) {
//     console.error('Toggle venue status error:', error);
//     return errorResponse(res, 'Error updating venue status', 500);
//   }
// };

// export const deleteVenue = async (req, res) => {
//   try {
//     const venue = await Venue.findById(req.params.id);
    
//     if (!venue) {
//       return errorResponse(res, 'Venue not found', 404);
//     }

//     await Venue.findByIdAndDelete(req.params.id);

//     return successResponse(res, null, 'Venue deleted successfully');
//   } catch (error) {
//     console.error('Delete venue error:', error);
//     return errorResponse(res, 'Error deleting venue', 500);
//   }
// };

// export const getVenuesByProvider = async (req, res) => {
//   try {
//     const { providerId } = req.params;
//     const { isActive = true } = req.query;

//     const filter = { 
//       provider: providerId,
//       isActive: isActive === 'true'
//     };

//     const venues = await Venue.find(filter)
//       .populate('provider', 'storeName')
//       .sort({ createdAt: -1 });

//     return successResponse(res, { venues }, 'Provider venues fetched successfully');
//   } catch (error) {
//     console.error('Get venues by provider error:', error);
//     return errorResponse(res, 'Error fetching provider venues', 500);
//   }
// };

// models/Venue.js
import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  // General Information
  venueName: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true,
    maxlength: [100, 'Venue name cannot exceed 100 characters']
  },
  shortDescription: {
    type: String,
    trim: true
  },
  venueAddress: {
    type: String,
    required: [true, 'Venue address is required'],
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
    enum: ['EN', 'AR'],
    default: 'EN'
  },
  thumbnail: {
    type: String
  },

  // Contact Information
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required'],
    trim: true
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactWebsite: {
    type: String,
    trim: true
  },
  ownerManagerName: {
    type: String,
    required: [true, 'Owner/Manager name is required'],
    trim: true
  },
  ownerManagerPhone: {
    type: String,
    trim: true
  },
  ownerManagerEmail: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  openingHours: {
    type: String,
    required: [true, 'Opening hours are required']
  },
  closingHours: {
    type: String,
    required: [true, 'Closing hours are required']
  },
  holidaySchedule: {
    type: String,
    trim: true
  },

  // Media Enhancements
  images: [{
    type: String
  }],
  watermarkProtection: {
    type: Boolean,
    default: false
  },

  // Venue Facilities
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

  // Pricing & Booking
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
  cancellationPolicy: {  
    type: [String],
    trim: true
  },
  extraCharges: {
    type: String,
    trim: true
  },

  // Capacity & Layout
  seatingArrangement: {
    type: String,
    required: [true, 'Seating arrangement is required']
  },
  maxGuestsSeated: {
    type: Number,
    required: [true, 'Max seated guests is required'],
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

  // Location & Accessibility
  nearbyTransport: {
    type: String,
    trim: true
  },
  accessibilityInfo: {
    type: String,
    trim: true
  },

  // Documents & Tags
  documents: [{
    type: String
  }],
  searchTags: [{
    type: String,
    trim: true
  }],

  // Relations & Status
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

venueSchema.index({ provider: 1, isActive: 1 });
venueSchema.index({ venueName: 'text', venueAddress: 'text', ownerManagerName: 'text' });
venueSchema.index({ location: '2dsphere' }); // For lat/long queries if needed

export default mongoose.model('Venue', venueSchema);