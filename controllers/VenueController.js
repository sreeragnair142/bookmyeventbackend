// import Auditorium from '../models/Venuecreate.js';
// import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

// export const getAuditoriums = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, brand, category, type, zone } = req.query;

//     const filter = {};
    
//     if (req.user && req.user.role === 'provider') {
//       filter.provider = req.user.id;
//     }

//     if (search) {
//       filter.$or = [
//         { 'name.default': { $regex: search, $options: 'i' } },
//         { 'name.en': { $regex: search, $options: 'i' } },
//         { 'name.ar': { $regex: search, $options: 'i' } },
//         { storeName: { $regex: search, $options: 'i' } },
//         { model: { $regex: search, $options: 'i' } },
//         { address: { $regex: search, $options: 'i' } },
//         { storeAddress: { $regex: search, $options: 'i' } },
//         { zone: { $regex: search, $options: 'i' } },
//       ];
//     }

//     if (brand) filter.brand = brand;
//     if (category) filter.category = category;
//     if (type) filter.type = type;
//     if (zone) {
//       console.log('Applying zone filter:', zone);
//       filter.zone = zone;
//     }

//     const auditoriums = await Auditorium.find(filter)
//       .populate({
//         path: 'brand',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'category',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'provider',
//         select: 'name email phone',
//         strictPopulate: false
//       })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ createdAt: -1 });

//     const total = await Auditorium.countDocuments(filter);

//     const pagination = {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       itemsPerPage: parseInt(limit),
//     };

//     return paginatedResponse(res, { auditoriums }, pagination, 'Auditoriums fetched successfully');
//   } catch (error) {
//     console.error('Get auditoriums error:', error);
//     return errorResponse(res, 'Error fetching auditoriums', 500);
//   }
// };

// export const getAuditorium = async (req, res) => {
//   try {
//     const auditorium = await Auditorium.findById(req.params.id)
//       .populate({
//         path: 'brand',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'category',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'provider',
//         select: 'name email phone',
//         strictPopulate: false
//       });

//     if (!auditorium) {
//       return errorResponse(res, 'Auditorium not found', 404);
//     }

//     if (req.user && req.user.role === 'provider' && auditorium.provider._id.toString() !== req.user.id) {
//       return errorResponse(res, 'Not authorized to access this auditorium', 403);
//     }

//     return successResponse(res, { auditorium }, 'Auditorium fetched successfully');
//   } catch (error) {
//     console.error('Get auditorium error:', error);
//     return errorResponse(res, 'Error fetching auditorium', 500);
//   }
// };

// export const createAuditorium = async (req, res) => {
//   try {
//     console.log('Create auditorium request body:', JSON.stringify(req.body, null, 2));
//     console.log('Create auditorium files:', JSON.stringify(req.files, null, 2));

//     req.body.provider = req.user.id;

//     // Validate tinCertificate file
//     if (!req.files || !req.files.tinCertificate || req.files.tinCertificate.length === 0) {
//       return errorResponse(res, null, 400, [
//         { field: 'tinCertificate', message: 'TIN certificate is required', value: undefined }
//       ]);
//     }

//     if (req.files) {
//       if (req.files.thumbnail && req.files.thumbnail.length > 0) {
//         req.body.thumbnail = req.files.thumbnail[0].path.replace(/\\/g, '/');
//       }
//       if (req.files.images && req.files.images.length > 0) {
//         req.body.images = req.files.images.map(file => file.path.replace(/\\/g, '/'));
//       }
//       if (req.files.documents && req.files.documents.length > 0) {
//         req.body.documents = req.files.documents.map(file => file.path.replace(/\\/g, '/'));
//       }
//       if (req.files.floorPlan && req.files.floorPlan.length > 0) {
//         req.body.floorPlan = req.files.floorPlan[0].path.replace(/\\/g, '/');
//       }
//       if (req.files.tinCertificate && req.files.tinCertificate.length > 0) {
//         req.body.tinCertificate = req.files.tinCertificate[0].path.replace(/\\/g, '/');
//       }
//     }

//     const fieldsToParseAsJSON = [
//       'name', 'description', 'contact', 'owner', 'hours', 
//       'location', 'facilities', 'pricing', 'capacity', 'searchTags'
//     ];

//     for (const field of fieldsToParseAsJSON) {
//       if (req.body[field] && typeof req.body[field] === 'string') {
//         try {
//           req.body[field] = JSON.parse(req.body[field]);
//         } catch (error) {
//           console.error(`Error parsing ${field}:`, error);
//           return errorResponse(res, `Invalid JSON format for ${field}`, 400);
//         }
//       }

//       // Fix description field if it has an empty key
//       if (field === 'description' && req.body[field] && req.body[field]['']) {
//         try {
//           const parsedInner = JSON.parse(req.body[field]['']);
//           req.body[field] = {
//             default: parsedInner.default || req.body[field].default,
//             en: parsedInner.en || req.body[field].en,
//             ar: parsedInner.ar || req.body[field].ar
//           };
//         } catch (error) {
//           console.error('Error parsing inner description:', error);
//           return errorResponse(res, 'Invalid JSON format for description', 400);
//         }
//       }

//       if (field === 'owner' && (!req.body[field] || !req.body[field].firstName || !req.body[field].lastName || !req.body[field].email || !req.body[field].phone)) {
//         return errorResponse(res, null, 400, [
//           { field: 'ownerFirstName', message: 'Owner first name is required', value: req.body[field]?.firstName },
//           { field: 'ownerLastName', message: 'Owner last name is required', value: req.body[field]?.lastName },
//           { field: 'ownerEmail', message: 'Owner email is required', value: req.body[field]?.email },
//           { field: 'ownerPhone', message: 'Owner phone is required', value: req.body[field]?.phone }
//         ].filter(err => !req.body[field]?.[err.field.replace('owner', '').toLowerCase()]));
//       }
//       if (field === 'location' && (!req.body[field] || req.body[field].lat === undefined || req.body[field].lng === undefined)) {
//         return errorResponse(res, null, 400, [
//           { field: 'latitude', message: 'Latitude is required', value: req.body[field]?.lat },
//           { field: 'longitude', message: 'Longitude is required', value: req.body[field]?.lng }
//         ].filter(err => req.body[field]?.[err.field] === undefined));
//       }
//       if (field === 'name' && (!req.body[field] || !req.body[field].default || req.body[field].default.trim().length === 0)) {
//         return errorResponse(res, null, 400, [
//           { field: 'name.default', message: 'Default name is required', value: req.body[field]?.default }
//         ]);
//       }
//     }

//     // Validate zone as a string
//     if (!req.body.zone || typeof req.body.zone !== 'string') {
//       return errorResponse(res, null, 400, [
//         { field: 'zone', message: 'Zone is required and must be a string', value: req.body.zone }
//       ]);
//     }

//     if (req.body.tinExpireDate && typeof req.body.tinExpireDate === 'string') {
//       req.body.tinExpireDate = new Date(req.body.tinExpireDate);
//       if (isNaN(req.body.tinExpireDate)) {
//         return errorResponse(res, 'Invalid TIN expire date format', 400);
//       }
//     }

//     const numericFields = ['seatingCapacity', 'minimumDeliveryTime', 'maximumDeliveryTime', 'discount', 'advancePaymentPercent'];
//     for (const field of numericFields) {
//       if (req.body[field] && typeof req.body[field] === 'string') {
//         req.body[field] = Number(req.body[field]);
//         if (isNaN(req.body[field])) {
//           return errorResponse(res, `Invalid number format for ${field}`, 400);
//         }
//       }
//     }

//     const booleanFields = ['airCondition', 'isActive', 'isAvailable', 'watermarkProtection', 'multipleHalls', 'elderlyAccessibility', 'dynamicPricing', 'parking'];
//     booleanFields.forEach(field => {
//       if (req.body[field] !== undefined && typeof req.body[field] === 'string') {
//         req.body[field] = req.body[field].toLowerCase() === 'true';
//       }
//     });

//     // Ensure capacity is an array of objects
//     if (req.body.capacity) {
//       req.body.capacity = Object.entries(req.body.capacity).map(([key, value]) => {
//         if (typeof value === 'string') {
//           return { hall: value, seats: 0 }; // Default seats to 0 if not provided
//         }
//         return { hall: value.hall || key, seats: Number(value.seats) || 0 };
//       });
//     }

//     console.log('Processed request body before creation:', JSON.stringify(req.body, null, 2));

//     // Create the auditorium document
//     const auditorium = await Auditorium.create(req.body);
    
//     console.log('Created auditorium (before populate):', JSON.stringify(auditorium.toObject(), null, 2));

//     // Retrieve the saved auditorium with all fields
//     const savedAuditorium = await Auditorium.findById(auditorium._id)
//       .populate([
//         { path: 'brand', select: 'name image', strictPopulate: false },
//         { path: 'category', select: 'name image', strictPopulate: false },
//         { path: 'provider', select: 'name email phone', strictPopulate: false },
//       ]);

//     console.log('Saved auditorium (raw from DB):', JSON.stringify(savedAuditorium.toObject(), null, 2));

//     if (!savedAuditorium) {
//       return errorResponse(res, 'Failed to retrieve populated auditorium', 500);
//     }

//     console.log('Populated auditorium:', JSON.stringify(savedAuditorium.toObject(), null, 2));

//     // Explicitly ensure all fields are included
//     const responseData = savedAuditorium.toObject();
//     return successResponse(res, { auditorium: responseData }, 'Auditorium created successfully', 201);
//   } catch (error) {
//     console.error('Create auditorium error:', JSON.stringify(error, null, 2));
    
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => ({
//         field: err.path,
//         message: err.message,
//         value: err.value
//       }));
//       return errorResponse(res, 'Validation failed', 400, errors);
//     }
    
//     if (error.code === 11000) {
//       const field = Object.keys(error.keyValue)[0];
//       return errorResponse(res, `${field} already exists`, 400);
//     }
    
//     if (error.name === 'CastError') {
//       console.error('CastError details:', {
//         path: error.path,
//         value: error.value,
//         kind: error.kind
//       });
//       return errorResponse(res, null, 400, [{
//         field: error.path,
//         message: `Cast to ${error.kind} failed for value "${error.value}" at path "${error.path}" because of "${error.name}"`,
//         value: error.value
//       }]);
//     }
    
//     return errorResponse(res, `Error creating auditorium: ${error.message}`, 500);
//   }
// };
// export const updateAuditorium = async (req, res) => {
//   try {
//     console.log('Update auditorium request body:', JSON.stringify(req.body, null, 2));
//     console.log('Update auditorium files:', JSON.stringify(req.files, null, 2));

//     let auditorium = await Auditorium.findById(req.params.id);

//     if (!auditorium) {
//       return errorResponse(res, 'Auditorium not found', 404);
//     }

//     if (auditorium.provider.toString() !== req.user.id) {
//       return errorResponse(res, 'Not authorized to update this auditorium', 403);
//     }

//     const updateData = { ...req.body };
    
//     if (req.files) {
//       if (req.files.thumbnail && req.files.thumbnail.length > 0) {
//         updateData.thumbnail = req.files.thumbnail[0].path.replace(/\\/g, '/');
//       }
//       if (req.files.images && req.files.images.length > 0) {
//         updateData.images = req.files.images.map(file => file.path.replace(/\\/g, '/'));
//       }
//       if (req.files.documents && req.files.documents.length > 0) {
//         updateData.documents = req.files.documents.map(file => file.path.replace(/\\/g, '/'));
//       }
//       if (req.files.floorPlan && req.files.floorPlan.length > 0) {
//         updateData.floorPlan = req.files.floorPlan[0].path.replace(/\\/g, '/');
//       }
//       if (req.files.tinCertificate && req.files.tinCertificate.length > 0) {
//         updateData.tinCertificate = req.files.tinCertificate[0].path.replace(/\\/g, '/');
//       }
//     }

//     const fieldsToParseAsJSON = [
//       'name', 'description', 'contact', 'owner', 'hours', 
//       'location', 'facilities', 'pricing', 'capacity', 'searchTags'
//     ];

//     for (const field of fieldsToParseAsJSON) {
//       if (updateData[field] && typeof updateData[field] === 'string') {
//         try {
//           updateData[field] = JSON.parse(updateData[field]);
//         } catch (error) {
//           console.error(`Error parsing ${field}:`, error);
//           return errorResponse(res, `Invalid JSON format for ${field}`, 400);
//         }
//       }
//       if (field === 'owner' && updateData[field] && (!updateData[field].firstName || !updateData[field].lastName || !updateData[field].email || !updateData[field].phone)) {
//         return errorResponse(res, null, 400, [
//           { field: 'ownerFirstName', message: 'Owner first name is required', value: updateData[field]?.firstName },
//           { field: 'ownerLastName', message: 'Owner last name is required', value: updateData[field]?.lastName },
//           { field: 'ownerEmail', message: 'Owner email is required', value: updateData[field]?.email },
//           { field: 'ownerPhone', message: 'Owner phone is required', value: updateData[field]?.phone }
//         ].filter(err => !updateData[field]?.[err.field.replace('owner', '').toLowerCase()]));
//       }
//       if (field === 'location' && updateData[field] && (updateData[field].lat === undefined || updateData[field].lng === undefined)) {
//         return errorResponse(res, null, 400, [
//           { field: 'latitude', message: 'Latitude is required', value: updateData[field]?.lat },
//           { field: 'longitude', message: 'Longitude is required', value: updateData[field]?.lng }
//         ].filter(err => updateData[field]?.[err.field] === undefined));
//       }
//       if (field === 'name' && updateData[field] && (!updateData[field].default || updateData[field].default.trim().length === 0)) {
//         return errorResponse(res, null, 400, [
//           { field: 'name.default', message: 'Default name is required', value: updateData[field]?.default }
//         ]);
//       }
//     }

//     if (updateData.zone && typeof updateData.zone !== 'string') {
//       return errorResponse(res, null, 400, [
//         { field: 'zone', message: 'Zone must be a string', value: updateData.zone }
//       ]);
//     }

//     if (updateData.tinExpireDate && typeof updateData.tinExpireDate === 'string') {
//       updateData.tinExpireDate = new Date(updateData.tinExpireDate);
//       if (isNaN(updateData.tinExpireDate)) {
//         return errorResponse(res, 'Invalid TIN expire date format', 400);
//       }
//     }

//     const numericFields = ['seatingCapacity', 'minimumDeliveryTime', 'maximumDeliveryTime', 'discount', 'advancePaymentPercent'];
//     for (const field of numericFields) {
//       if (updateData[field] && typeof updateData[field] === 'string') {
//         updateData[field] = Number(updateData[field]);
//         if (isNaN(updateData[field])) {
//           return errorResponse(res, `Invalid number format for ${field}`, 400);
//         }
//       }
//     }

//     const booleanFields = ['airCondition', 'isActive', 'isAvailable', 'watermarkProtection', 'multipleHalls', 'elderlyAccessibility', 'dynamicPricing', 'parking'];
//     booleanFields.forEach(field => {
//       if (updateData[field] !== undefined && typeof updateData[field] === 'string') {
//         updateData[field] = updateData[field].toLowerCase() === 'true';
//       }
//     });

//     console.log('Processed update data:', JSON.stringify(updateData, null, 2));

//     auditorium = await Auditorium.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     ).populate([
//       { 
//         path: 'brand', 
//         select: 'name image',
//         strictPopulate: false
//       },
//       { 
//         path: 'category', 
//         select: 'name image',
//         strictPopulate: false
//       },
//       { 
//         path: 'provider', 
//         select: 'name email phone',
//         strictPopulate: false
//       },
//     ]);

//     return successResponse(res, { auditorium: auditorium.toObject() }, 'Auditorium updated successfully');
//   } catch (error) {
//     console.error('Update auditorium error:', JSON.stringify(error, null, 2));
    
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => ({
//         field: err.path,
//         message: err.message,
//         value: err.value
//       }));
//       return errorResponse(res, 'Validation failed', 400, errors);
//     }
    
//     if (error.name === 'CastError') {
//       console.error('CastError details:', {
//         path: error.path,
//         value: error.value,
//         kind: error.kind
//       });
//       return errorResponse(res, null, 400, [{
//         field: error.path,
//         message: `Cast to ${error.kind} failed for value "${error.value}" at path "${error.path}" because of "${error.name}"`,
//         value: error.value
//       }]);
//     }
    
//     return errorResponse(res, `Error updating auditorium: ${error.message}`, 500);
//   }
// };

// export const deleteAuditorium = async (req, res) => {
//   try {
//     const auditorium = await Auditorium.findById(req.params.id);

//     if (!auditorium) {
//       return errorResponse(res, 'Auditorium not found', 404);
//     }

//     if (auditorium.provider.toString() !== req.user.id) {
//       return errorResponse(res, 'Not authorized to delete this auditorium', 403);
//     }

//     await auditorium.deleteOne();

//     return successResponse(res, null, 'Auditorium deleted successfully');
//   } catch (error) {
//     console.error('Delete auditorium error:', error);
//     return errorResponse(res, 'Error deleting auditorium', 500);
//   }
// };

// export const getPublicAuditoriums = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, brand, category, type, city, zone } = req.query;

//     const filter = { isActive: true, isAvailable: true };

//     if (search) {
//       filter.$or = [
//         { 'name.default': { $regex: search, $options: 'i' } },
//         { 'name.en': { $regex: search, $options: 'i' } },
//         { 'name.ar': { $regex: search, $options: 'i' } },
//         { storeName: { $regex: search, $options: 'i' } },
//         { model: { $regex: search, $options: 'i' } },
//         { address: { $regex: search, $options: 'i' } },
//         { storeAddress: { $regex: search, $options: 'i' } },
//         { zone: { $regex: search, $options: 'i' } },
//       ];
//     }

//     if (brand) filter.brand = brand;
//     if (category) filter.category = category;
//     if (type) filter.type = type;
//     if (city) filter.address = { $regex: city, $options: 'i' };
//     if (zone) {
//       console.log('Applying zone filter in public:', zone);
//       filter.zone = zone;
//     }

//     const auditoriums = await Auditorium.find(filter)
//       .populate({
//         path: 'brand',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'category',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'provider',
//         select: 'name phone',
//         strictPopulate: false
//       })
//       .select('-documents -tinCertificate -businessTIN -__v')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ rating: -1, createdAt: -1 });

//     const total = await Auditorium.countDocuments(filter);

//     const pagination = {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       itemsPerPage: parseInt(limit),
//     };

//     return paginatedResponse(res, { auditoriums }, pagination, 'Public auditoriums fetched successfully');
//   } catch (error) {
//     console.error('Get public auditoriums error:', error);
//     return errorResponse(res, 'Error fetching auditoriums', 500);
//   }
// };

// export const getPublicAuditorium = async (req, res) => {
//   try {
//     const auditorium = await Auditorium.findOne({ 
//       _id: req.params.id, 
//       isActive: true, 
//       isAvailable: true 
//     })
//       .populate({
//         path: 'brand',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'category',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'provider',
//         select: 'name phone',
//         strictPopulate: false
//       })
//       .select('-documents -tinCertificate -businessTIN -owner.email -__v');

//     if (!auditorium) {
//       return errorResponse(res, 'Auditorium not found or not available', 404);
//     }

//     return successResponse(res, { auditorium }, 'Auditorium fetched successfully');
//   } catch (error) {
//     console.error('Get public auditorium error:', error);
//     return errorResponse(res, 'Error fetching auditorium', 500);
//   }
// };

// export const getAuditoriumsByZone = async (req, res) => {
//   try {
//     const { zone } = req.params;
//     const { page = 1, limit = 10, type, category } = req.query;

//     console.log('Fetching auditoriums for zone:', zone);

//     const filter = { 
//       zone: zone,
//       isActive: true, 
//       isAvailable: true 
//     };

//     if (type) filter.type = type;
//     if (category) filter.category = category;

//     const auditoriums = await Auditorium.find(filter)
//       .populate({
//         path: 'brand',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'category',
//         select: 'name image',
//         strictPopulate: false
//       })
//       .populate({
//         path: 'provider',
//         select: 'name phone',
//         strictPopulate: false
//       })
//       .select('-documents -tinCertificate -businessTIN -__v')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ rating: -1, createdAt: -1 });

//     const total = await Auditorium.countDocuments(filter);

//     const pagination = {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       itemsPerPage: parseInt(limit),
//     };

//     return paginatedResponse(res, { auditoriums }, pagination, `Auditoriums in ${zone} fetched successfully`);
//   } catch (error) {
//     console.error('Get auditoriums by zone error:', error);
//     return errorResponse(res, 'Error fetching auditoriums by zone', 500);
//   }
// };

// export default {
//   getAuditoriums,
//   getAuditorium,
//   createAuditorium,
//   updateAuditorium,
//   deleteAuditorium,
//   getPublicAuditoriums,
//   getPublicAuditorium,
//   getAuditoriumsByZone,
// }; 




// controllers/VenueController.js
import Venue from '../models/Venuecreate.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllVenues = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      providerId, 
      isActive,
      search 
    } = req.query;

    const filter = {};
    if (providerId) filter.provider = providerId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { venueName: { $regex: search, $options: 'i' } },
        { venueAddress: { $regex: search, $options: 'i' } },
        { ownerManagerName: { $regex: search, $options: 'i' } }
      ];
    }

    const venues = await Venue.find(filter)
      .populate('provider', 'storeName ownerFirstName ownerLastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Venue.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { venues }, pagination, 'Venues fetched successfully');
  } catch (error) {
    console.error('Get venues error:', error);
    return errorResponse(res, 'Error fetching venues', 500);
  }
};

export const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate('provider', 'storeName ownerFirstName ownerLastName');

    if (!venue) {
      return errorResponse(res, 'Venue not found', 404);
    }

    return successResponse(res, { venue }, 'Venue fetched successfully');
  } catch (error) {
    console.error('Get venue error:', error);
    return errorResponse(res, 'Error fetching venue', 500);
  }
};

export const createVenue = async (req, res) => {
  try {
    const venueData = { ...req.body };

    // Handle file uploads
    if (req.files) {
      if (req.files.thumbnail) {
        venueData.thumbnail = req.files.thumbnail[0].path.replace(/\\/g, '/');
      }
      if (req.files.images) {
        venueData.images = req.files.images.map(file => file.path.replace(/\\/g, '/'));
      }
      if (req.files.floorPlan) {
        venueData.floorPlan = req.files.floorPlan[0].path.replace(/\\/g, '/');
      }
      if (req.files.documents) {
        venueData.documents = req.files.documents.map(file => file.path.replace(/\\/g, '/'));
      }
    } else {
      console.log('No files uploaded in request');
    }

    // Safe parsing for numbers and booleans
    const safeParseInt = (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? undefined : parsed;
    };

    const safeParseFloat = (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    };

    const safeParseBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      const stringValue = String(value).toLowerCase().trim();
      if (stringValue === "true" || stringValue === "1" || stringValue === "yes") return true;
      if (stringValue === "false" || stringValue === "0" || stringValue === "no") return false;
      return undefined;
    };

    // Parse numeric fields
    ['latitude', 'longitude', 'hourlyPrice', 'perDayPrice', 'distanceWisePrice', 'discount', 'advanceDeposit', 'maxGuestsSeated', 'maxGuestsStanding', 'parkingCapacity'].forEach(field => {
      if (venueData[field] !== undefined) {
        venueData[field] = safeParseFloat(venueData[field]) || safeParseInt(venueData[field]);
      }
    });

    // Parse boolean fields
    ['watermarkProtection', 'dynamicPricing', 'multipleHalls', 'parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
      if (venueData[field] !== undefined) {
        venueData[field] = safeParseBoolean(venueData[field]);
      }
    });

    // Handle facilities object
    if (venueData.facilities) {
      ['parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
        if (venueData.facilities[field] !== undefined) {
          venueData.facilities[field] = safeParseBoolean(venueData.facilities[field]);
        }
      });
      if (venueData.facilities.parkingCapacity !== undefined) {
        venueData.facilities.parkingCapacity = safeParseInt(venueData.facilities.parkingCapacity);
      }
    }

    // Set defaults
    venueData.isActive = venueData.isActive ?? true;
    venueData.language = venueData.language ?? 'EN';
    venueData.rentalType = venueData.rentalType ?? 'hourly';

    console.log('Venue data before save:', venueData); // Debug log
    const venue = new Venue(venueData);
    await venue.save();

    const populatedVenue = await Venue.findById(venue._id).populate('provider', 'storeName ownerFirstName ownerLastName');

    return successResponse(res, { venue: populatedVenue }, 'Venue created successfully', 201);
  } catch (error) {
    console.error('Create venue error:', error.stack); // Log full stack trace
    return errorResponse(res, 'Error creating venue', 500);
  }
};

export const updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return errorResponse(res, 'Venue not found', 404);
    }

    const updateData = { ...req.body };

    // Handle file uploads (update existing)
    if (req.files) {
      if (req.files.thumbnail) {
        updateData.thumbnail = req.files.thumbnail[0].path.replace(/\\/g, '/');
      }
      if (req.files.images) {
        updateData.images = [...(venue.images || []), ...req.files.images.map(file => file.path.replace(/\\/g, '/'))];
      }
      if (req.files.floorPlan) {
        updateData.floorPlan = req.files.floorPlan[0].path.replace(/\\/g, '/');
      }
      if (req.files.documents) {
        updateData.documents = [...(venue.documents || []), ...req.files.documents.map(file => file.path.replace(/\\/g, '/'))];
      }
    }

    // Reuse safe parsing from create
    const safeParseInt = (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? undefined : parsed;
    };

    const safeParseFloat = (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    };

    const safeParseBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      const stringValue = String(value).toLowerCase().trim();
      if (stringValue === "true" || stringValue === "1" || stringValue === "yes") return true;
      if (stringValue === "false" || stringValue === "0" || stringValue === "no") return false;
      return undefined;
    };

    // Parse numeric fields
    ['latitude', 'longitude', 'hourlyPrice', 'perDayPrice', 'distanceWisePrice', 'discount', 'advanceDeposit', 'maxGuestsSeated', 'maxGuestsStanding', 'parkingCapacity'].forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = safeParseFloat(updateData[field]) || safeParseInt(updateData[field]);
      }
    });

    // Parse boolean fields
    ['watermarkProtection', 'dynamicPricing', 'multipleHalls', 'parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = safeParseBoolean(updateData[field]);
      }
    });

    // Handle facilities object
    if (updateData.facilities) {
      ['parkingAvailability', 'wheelchairAccessibility', 'securityArrangements', 'foodCateringAvailability', 'stageLightingAudio', 'wifiAvailability'].forEach(field => {
        if (updateData.facilities[field] !== undefined) {
          updateData.facilities[field] = safeParseBoolean(updateData.facilities[field]);
        }
      });
      if (updateData.facilities.parkingCapacity !== undefined) {
        updateData.facilities.parkingCapacity = safeParseInt(updateData.facilities.parkingCapacity);
      }
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updatedVenue = await Venue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('provider', 'storeName ownerFirstName ownerLastName');

    return successResponse(res, { venue: updatedVenue }, 'Venue updated successfully');
  } catch (error) {
    console.error('Update venue error:', error.stack);
    return errorResponse(res, 'Error updating venue', 500);
  }
};

export const toggleVenueStatus = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return errorResponse(res, 'Venue not found', 404);
    }

    venue.isActive = !venue.isActive;
    await venue.save();

    return successResponse(res, { venue }, `Venue ${venue.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle venue status error:', error.stack);
    return errorResponse(res, 'Error updating venue status', 500);
  }
};

export const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return errorResponse(res, 'Venue not found', 404);
    }

    await Venue.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Venue deleted successfully');
  } catch (error) {
    console.error('Delete venue error:', error.stack);
    return errorResponse(res, 'Error deleting venue', 500);
  }
};

export const getVenuesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { isActive = true } = req.query;

    const filter = { 
      provider: providerId,
      isActive: isActive === 'true'
    };

    const venues = await Venue.find(filter)
      .populate('provider', 'storeName')
      .sort({ createdAt: -1 });

    return successResponse(res, { venues }, 'Provider venues fetched successfully');
  } catch (error) {
    console.error('Get venues by provider error:', error.stack);
    return errorResponse(res, 'Error fetching provider venues', 500);
  }
};