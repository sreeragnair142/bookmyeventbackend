// import express from "express";
// import { body } from "express-validator";
// import Provider from "../models/Provider.js";
// import { authenticate, authorize } from "../middleware/auth.js";
// import upload, { handleMulterError } from "../middleware/upload.js";
// import { validateRequest } from "../utils/validation.js";
// import {
//   successResponse,
//   errorResponse,
//   paginatedResponse,
// } from "../utils/responseFormatter.js";

// const router = express.Router();

// // Helper functions to safely convert values to the expected type
// const safeParseInt = (value) => {
//   console.log("safeParseInt input:", value, typeof value);

//   if (value === undefined || value === null || value === "") return undefined;

//   // If it's already a number, return it if it's an integer
//   if (typeof value === "number") {
//     return Number.isInteger(value) ? value : Math.floor(value);
//   }

//   // If it's an array, take the first element
//   if (Array.isArray(value)) {
//     if (value.length === 0) return undefined;
//     value = value[0];
//   }

//   // If it's an object (but not array), try to get a meaningful value
//   if (typeof value === "object") {
//     console.warn("Unexpected object in safeParseInt:", value);
//     return undefined;
//   }

//   // Convert to string first, then to number
//   const stringValue = String(value).trim();
//   if (stringValue === "") return undefined;

//   const parsed = parseInt(stringValue, 10);
//   console.log("safeParseInt result:", parsed);

//   return isNaN(parsed) ? undefined : parsed;
// };

// const safeParseFloat = (value) => {
//   console.log("safeParseFloat input:", value, typeof value);

//   if (value === undefined || value === null || value === "") return undefined;

//   // If it's already a number, return it
//   if (typeof value === "number") {
//     return isFinite(value) ? value : undefined;
//   }

//   // If it's an array, take the first element
//   if (Array.isArray(value)) {
//     if (value.length === 0) return undefined;
//     value = value[0];
//   }

//   // If it's an object (but not array), try to get a meaningful value
//   if (typeof value === "object") {
//     console.warn("Unexpected object in safeParseFloat:", value);
//     return undefined;
//   }

//   // Convert to string first, then to number
//   const stringValue = String(value).trim();
//   if (stringValue === "") return undefined;

//   const parsed = parseFloat(stringValue);
//   console.log("safeParseFloat result:", parsed);

//   return isNaN(parsed) ? undefined : parsed;
// };

// const safeParseBoolean = (value) => {
//   console.log("safeParseBoolean input:", value, typeof value);

//   if (value === undefined || value === null) return undefined;

//   // If it's already a boolean, return it
//   if (typeof value === "boolean") return value;

//   // If it's an array, take the first element
//   if (Array.isArray(value)) {
//     if (value.length === 0) return undefined;
//     value = value[0];
//   }

//   // If it's an object (but not array), return undefined
//   if (typeof value === "object") {
//     console.warn("Unexpected object in safeParseBoolean:", value);
//     return undefined;
//   }

//   // Convert to string and check
//   const stringValue = String(value).toLowerCase().trim();

//   if (stringValue === "true" || stringValue === "1" || stringValue === "yes")
//     return true;
//   if (stringValue === "false" || stringValue === "0" || stringValue === "no")
//     return false;

//   return undefined;
// };

// // Get all providers (GET /api/providers)
// router.get("/", async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       zone,
//       isActive,
//       isApproved,
//       isFeatured,
//       search,
//     } = req.query;

//     const filter = {};
//     if (zone) filter.zone = zone;
//     if (isActive !== undefined) filter.isActive = isActive === "true";
//     if (isApproved !== undefined) filter.isApproved = isApproved === "true";
//     if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
//     if (search) {
//       filter.$or = [
//         { storeName: { $regex: search, $options: "i" } },
//         { ownerFirstName: { $regex: search, $options: "i" } },
//         { ownerLastName: { $regex: search, $options: "i" } },
//       ];
//     }

//     const providers = await Provider.find(filter)
//       .populate("zone", "name")
//       .populate("categories", "name")
//       .populate("approvedBy", "firstName lastName")
//       .sort({ isFeatured: -1, createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Provider.countDocuments(filter);

//     const pagination = {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       itemsPerPage: parseInt(limit),
//     };

//     // Use response formatter if available, otherwise use standard format
//     if (typeof paginatedResponse === "function") {
//       return paginatedResponse(
//         res,
//         { providers },
//         pagination,
//         "Providers fetched successfully"
//       );
//     } else {
//       return res.json({
//         success: true,
//         message: "Providers fetched successfully",
//         data: {
//           providers,
//           pagination,
//         },
//       });
//     }
//   } catch (error) {
//     console.error("Get providers error:", error);
//     if (typeof errorResponse === "function") {
//       return errorResponse(res, "Error fetching providers", 500);
//     } else {
//       return res.status(500).json({
//         success: false,
//         message: "Error fetching providers",
//       });
//     }
//   }
// });

// // Create new provider (POST /api/providers)
// router.post(
//   "/",
//   // Temporarily remove authentication for testing
//   // authenticate,
//   // authorize('admin', 'manager'),
//   upload.fields([
//     { name: "logo", maxCount: 1 },
//     { name: "coverImage", maxCount: 1 },
//     { name: "tinCertificate", maxCount: 1 },
//     { name: "bannerImage", maxCount: 1 },
//     { name: "categoryImage", maxCount: 1 },
//   ]),
//   handleMulterError,
//   [
//     body("storeName")
//       .optional()
//       .trim()
//       .isLength({ min: 1, max: 100 })
//       .withMessage("Store name must be 1-100 characters"),
//     body("ownerEmail")
//       .optional()
//       .isEmail()
//       .withMessage("Valid email is required"),
//     body("latitude")
//       .optional()
//       .isFloat()
//       .withMessage("Valid latitude is required"),
//     body("longitude")
//       .optional()
//       .isFloat()
//       .withMessage("Valid longitude is required"),
//   ],
//   // Temporarily disable validation for testing
//   // validateRequest,
//   async (req, res) => {
//     try {
//       console.log("=== CREATE PROVIDER DEBUG ===");
//       console.log("Files received:", req.files);
//       console.log("Body received:", req.body);

//       const providerData = { ...req.body };

//       // Handle all file uploads
//       if (req.files) {
//         if (req.files.logo) {
//           providerData.logo = req.files.logo[0].path.replace(/\\/g, "/");
//         }
//         if (req.files.coverImage) {
//           providerData.coverImage = req.files.coverImage[0].path.replace(
//             /\\/g,
//             "/"
//           );
//         }
//         if (req.files.tinCertificate) {
//           providerData.tinCertificate =
//             req.files.tinCertificate[0].path.replace(/\\/g, "/");
//         }
//         if (req.files.bannerImage) {
//           providerData.bannerImage = req.files.bannerImage[0].path.replace(
//             /\\/g,
//             "/"
//           );
//         }
//         if (req.files.categoryImage) {
//           providerData.categoryImage = req.files.categoryImage[0].path.replace(
//             /\\/g,
//             "/"
//           );
//         }
//       }

//       console.log("Provider data to save:", providerData);
//       console.log("Data types check:");
//       console.log(
//         "estimatedDeliveryTime:",
//         typeof providerData.estimatedDeliveryTime,
//         providerData.estimatedDeliveryTime
//       );
//       console.log(
//         "estimatedDeliveryTimeMax:",
//         typeof providerData.estimatedDeliveryTimeMax,
//         providerData.estimatedDeliveryTimeMax
//       );
//       console.log(
//         "latitude:",
//         typeof providerData.latitude,
//         providerData.latitude
//       );
//       console.log(
//         "longitude:",
//         typeof providerData.longitude,
//         providerData.longitude
//       );

//       // Create a clean object without problematic conversions first
//       const cleanData = {};

//       // Copy all string fields directly (including all possible variations)
//       const stringFields = [
//         "storeName",
//         "ownerFirstName",
//         "ownerLastName",
//         "ownerEmail",
//         "ownerPhone",
//         "address",
//         "storeAddress",
//         "description",
//         "logo",
//         "coverImage",
//         "tinCertificate",
//         "bannerImage",
//         "categoryImage",
//         "zone",
//         "businessTIN",
//         "tinExpireDate",
//         "ownerName",
//         "businessName",
//         "contactNumber",
//         "email",
//       ];

//       stringFields.forEach((field) => {
//         if (
//           providerData[field] !== undefined &&
//           providerData[field] !== null &&
//           providerData[field] !== ""
//         ) {
//           cleanData[field] = String(providerData[field]).trim();
//         }
//       });

//       // Handle numeric fields with extra safety
//       const numericFields = {
//         latitude: "float",
//         longitude: "float",
//         estimatedDeliveryTime: "int", // This is minimum delivery time
//         estimatedDeliveryTimeMax: "int", // This is maximum delivery time
//         minimumDeliveryTime: "int", // Alternative field name
//         maximumDeliveryTime: "int", // Alternative field name
//         averageRating: "float",
//         totalReviews: "int",
//       };

//       Object.keys(numericFields).forEach((field) => {
//         const value = providerData[field];
//         console.log(`Processing ${field}:`, value, typeof value);

//         if (value !== undefined && value !== null && value !== "") {
//           try {
//             if (numericFields[field] === "float") {
//               const parsed = safeParseFloat(value);
//               if (parsed !== undefined) cleanData[field] = parsed;
//             } else {
//               const parsed = safeParseInt(value);
//               if (parsed !== undefined) cleanData[field] = parsed;
//             }
//           } catch (error) {
//             console.warn(`Failed to parse ${field}:`, error.message);
//           }
//         }
//       });

//       // Handle boolean fields
//       const booleanFields = ["isActive", "isApproved", "isFeatured"];
//       booleanFields.forEach((field) => {
//         const value = providerData[field];
//         if (value !== undefined && value !== null) {
//           try {
//             const parsed = safeParseBoolean(value);
//             if (parsed !== undefined) cleanData[field] = parsed;
//           } catch (error) {
//             console.warn(`Failed to parse boolean ${field}:`, error.message);
//           }
//         }
//       });

//       // Set defaults for required fields
//       const finalProviderData = {
//         ...cleanData,
//         isActive: cleanData.isActive ?? true,
//         isApproved: cleanData.isApproved ?? false,
//         isFeatured: cleanData.isFeatured ?? false,
//         averageRating: cleanData.averageRating ?? 0,
//         totalReviews: cleanData.totalReviews ?? 0,

//         // Ensure required fields have values - using the exact field names the model expects
//         storeName: cleanData.storeName || "Default Store Name",
//         storeAddress:
//           cleanData.storeAddress || cleanData.address || "Default Address",
//         businessTIN: cleanData.businessTIN || "DEFAULT-TIN",
//         tinExpireDate:
//           cleanData.tinExpireDate ||
//           new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
//             .toISOString()
//             .split("T")[0],

//         // Map delivery time fields to the correct field names the model expects
//         minimumDeliveryTime:
//           cleanData.minimumDeliveryTime ||
//           cleanData.estimatedDeliveryTime ||
//           15,
//         maximumDeliveryTime:
//           cleanData.maximumDeliveryTime ||
//           cleanData.estimatedDeliveryTimeMax ||
//           45,

//         // Keep the original field names too for backward compatibility
//         estimatedDeliveryTime: cleanData.estimatedDeliveryTime || 15,
//         estimatedDeliveryTimeMax: cleanData.estimatedDeliveryTimeMax || 45,

//         // Handle categories array
//         categories: Array.isArray(providerData.categories)
//           ? providerData.categories
//           : providerData.categories
//           ? [providerData.categories]
//           : [],
//       };

//       // Remove any remaining undefined values
//       Object.keys(finalProviderData).forEach((key) => {
//         if (
//           finalProviderData[key] === undefined ||
//           finalProviderData[key] === null ||
//           finalProviderData[key] === ""
//         ) {
//           delete finalProviderData[key];
//         }
//       });

//       console.log("Final provider data with defaults:", finalProviderData);
//       console.log("Required fields check:");
//       console.log("- storeName:", finalProviderData.storeName);
//       console.log("- storeAddress:", finalProviderData.storeAddress);
//       console.log("- businessTIN:", finalProviderData.businessTIN);
//       console.log("- tinExpireDate:", finalProviderData.tinExpireDate);
//       console.log(
//         "- minimumDeliveryTime:",
//         finalProviderData.minimumDeliveryTime
//       );
//       console.log(
//         "- maximumDeliveryTime:",
//         finalProviderData.maximumDeliveryTime
//       );

//       const provider = new Provider(finalProviderData);
//       await provider.save();

//       const populatedProvider = await Provider.findById(provider._id)
//         .populate("zone", "name")
//         .populate("categories", "name")
//         .populate("approvedBy", "firstName lastName");

//       if (typeof successResponse === "function") {
//         return successResponse(
//           res,
//           { provider: populatedProvider },
//           "Provider created successfully",
//           201
//         );
//       } else {
//         return res.status(201).json({
//           success: true,
//           message: "Provider created successfully",
//           data: { provider: populatedProvider },
//         });
//       }
//     } catch (error) {
//       console.error("Create provider error:", error);
//       console.error("Error details:", {
//         name: error.name,
//         message: error.message,
//         stack: error.stack,
//         errors: error.errors, // MongoDB validation errors
//       });

//       // Handle specific MongoDB validation errors
//       if (error.name === "ValidationError") {
//         const validationErrors = Object.values(error.errors).map(
//           (err) => err.message
//         );
//         if (typeof errorResponse === "function") {
//           return errorResponse(
//             res,
//             `Validation error: ${validationErrors.join(", ")}`,
//             400
//           );
//         } else {
//           return res.status(400).json({
//             success: false,
//             message: `Validation error: ${validationErrors.join(", ")}`,
//             errors: validationErrors,
//           });
//         }
//       }

//       if (typeof errorResponse === "function") {
//         return errorResponse(
//           res,
//           `Error creating provider: ${error.message}`,
//           500
//         );
//       } else {
//         return res.status(500).json({
//           success: false,
//           message: `Error creating provider: ${error.message}`,
//           error: error.toString(),
//         });
//       }
//     }
//   }
// );

// // Get providers by zone (GET /api/providers/zone/:zoneId)
// router.get("/zone/:zoneId", async (req, res) => {
//   try {
//     const { zoneId } = req.params;
//     const { isFeatured, isActive = true } = req.query;

//     const filter = {
//       zone: zoneId,
//       isActive: isActive === "true",
//       isApproved: true,
//     };

//     if (isFeatured !== undefined) {
//       filter.isFeatured = isFeatured === "true";
//     }

//     const providers = await Provider.find(filter)
//       .populate("zone", "name")
//       .populate("categories", "name")
//       .sort({ isFeatured: -1, averageRating: -1 });

//     if (typeof successResponse === "function") {
//       return successResponse(
//         res,
//         { providers },
//         "Zone providers fetched successfully"
//       );
//     } else {
//       return res.json({
//         success: true,
//         message: "Zone providers fetched successfully",
//         data: { providers },
//       });
//     }
//   } catch (error) {
//     console.error("Get providers by zone error:", error);
//     if (typeof errorResponse === "function") {
//       return errorResponse(res, "Error fetching zone providers", 500);
//     } else {
//       return res.status(500).json({
//         success: false,
//         message: "Error fetching zone providers",
//       });
//     }
//   }
// });

// // Get provider by ID (GET /api/providers/:id)
// router.get("/:id", async (req, res) => {
//   try {
//     const provider = await Provider.findById(req.params.id)
//       .populate("zone", "name")
//       .populate("categories", "name image")
//       .populate("approvedBy", "firstName lastName");

//     if (!provider) {
//       if (typeof errorResponse === "function") {
//         return errorResponse(res, "Provider not found", 404);
//       } else {
//         return res.status(404).json({
//           success: false,
//           message: "Provider not found",
//         });
//       }
//     }

//     if (typeof successResponse === "function") {
//       return successResponse(
//         res,
//         { provider },
//         "Provider fetched successfully"
//       );
//     } else {
//       return res.json({
//         success: true,
//         message: "Provider fetched successfully",
//         data: { provider },
//       });
//     }
//   } catch (error) {
//     console.error("Get provider error:", error);
//     if (typeof errorResponse === "function") {
//       return errorResponse(res, "Error fetching provider", 500);
//     } else {
//       return res.status(500).json({
//         success: false,
//         message: "Error fetching provider",
//       });
//     }
//   }
// });

// // Update provider (PUT /api/providers/:id)
// router.put(
//   "/:id",
//   // Temporarily disable authentication for testing
//   // authenticate,
//   // authorize('admin', 'manager'),
//   upload.fields([
//     { name: "logo", maxCount: 1 },
//     { name: "coverImage", maxCount: 1 },
//     { name: "tinCertificate", maxCount: 1 },
//     { name: "bannerImage", maxCount: 1 },
//     { name: "categoryImage", maxCount: 1 },
//   ]),
//   handleMulterError,
//   [
//     body("storeName")
//       .optional()
//       .trim()
//       .isLength({ min: 1, max: 100 })
//       .withMessage("Store name must be 1-100 characters"),
//     body("ownerEmail")
//       .optional()
//       .isEmail()
//       .withMessage("Valid email is required"),
//     body("zone")
//       .optional()
//       .isMongoId()
//       .withMessage("Valid zone ID is required"),
//   ],
//   // Temporarily disable validation for testing
//   // validateRequest,
//   async (req, res) => {
//     try {
//       const provider = await Provider.findById(req.params.id);

//       if (!provider) {
//         if (typeof errorResponse === "function") {
//           return errorResponse(res, "Provider not found", 404);
//         } else {
//           return res.status(404).json({
//             success: false,
//             message: "Provider not found",
//           });
//         }
//       }

//       const updateData = { ...req.body };

//       // Safe type conversion for update data
//       if (updateData.latitude !== undefined) {
//         updateData.latitude = safeParseFloat(updateData.latitude);
//       }
//       if (updateData.longitude !== undefined) {
//         updateData.longitude = safeParseFloat(updateData.longitude);
//       }
//       if (updateData.estimatedDeliveryTime !== undefined) {
//         updateData.estimatedDeliveryTime = safeParseInt(
//           updateData.estimatedDeliveryTime
//         );
//       }
//       if (updateData.estimatedDeliveryTimeMax !== undefined) {
//         updateData.estimatedDeliveryTimeMax = safeParseInt(
//           updateData.estimatedDeliveryTimeMax
//         );
//       }
//       if (updateData.isActive !== undefined) {
//         updateData.isActive = safeParseBoolean(updateData.isActive);
//       }
//       if (updateData.isApproved !== undefined) {
//         updateData.isApproved = safeParseBoolean(updateData.isApproved);
//       }
//       if (updateData.isFeatured !== undefined) {
//         updateData.isFeatured = safeParseBoolean(updateData.isFeatured);
//       }

//       if (req.files) {
//         if (req.files.logo) {
//           updateData.logo = req.files.logo[0].path.replace(/\\/g, "/");
//         }
//         if (req.files.coverImage) {
//           updateData.coverImage = req.files.coverImage[0].path.replace(
//             /\\/g,
//             "/"
//           );
//         }
//         if (req.files.tinCertificate) {
//           updateData.tinCertificate = req.files.tinCertificate[0].path.replace(
//             /\\/g,
//             "/"
//           );
//         }
//         if (req.files.bannerImage) {
//           updateData.bannerImage = req.files.bannerImage[0].path.replace(
//             /\\/g,
//             "/"
//           );
//         }
//         if (req.files.categoryImage) {
//           updateData.categoryImage = req.files.categoryImage[0].path.replace(
//             /\\/g,
//             "/"
//           );
//         }
//       }

//       // Remove undefined values
//       Object.keys(updateData).forEach((key) => {
//         if (updateData[key] === undefined) {
//           delete updateData[key];
//         }
//       });

//       const updatedProvider = await Provider.findByIdAndUpdate(
//         req.params.id,
//         updateData,
//         { new: true, runValidators: true }
//       ).populate([
//         { path: "zone", select: "name" },
//         { path: "categories", select: "name" },
//         { path: "approvedBy", select: "firstName lastName" },
//       ]);

//       if (typeof successResponse === "function") {
//         return successResponse(
//           res,
//           { provider: updatedProvider },
//           "Provider updated successfully"
//         );
//       } else {
//         return res.json({
//           success: true,
//           message: "Provider updated successfully",
//           data: { provider: updatedProvider },
//         });
//       }
//     } catch (error) {
//       console.error("Update provider error:", error);
//       if (typeof errorResponse === "function") {
//         return errorResponse(res, "Error updating provider", 500);
//       } else {
//         return res.status(500).json({
//           success: false,
//           message: "Error updating provider",
//         });
//       }
//     }
//   }
// );

// // Toggle provider status (PATCH /api/providers/:id/toggle-status)
// // Toggle featured status

// router.patch("/:id/toggle-featured", async (req, res) => {
//   try {
//     console.log(`Toggle featured for provider: ${req.params.id}`);

//     const provider = await Provider.findById(req.params.id);
//     if (!provider) {
//       return res.status(404).json({
//         success: false,
//         message: "Provider not found",
//       });
//     }

//     provider.isFeatured = !provider.isFeatured;
//     await provider.save();

//     console.log(
//       `Provider ${provider._id} featured status: ${provider.isFeatured}`
//     );

//     return res.json({
//       success: true,
//       message: `Provider ${provider.isFeatured ? "featured" : "unfeatured"}`,
//       data: { provider },
//     });
//   } catch (error) {
//     console.error("Toggle featured error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// });

// router.patch("/:id/toggle-status", async (req, res) => {
//   try {
//     console.log(`Toggle status for provider: ${req.params.id}`);

//     const provider = await Provider.findById(req.params.id);
//     if (!provider) {
//       return res.status(404).json({
//         success: false,
//         message: "Provider not found",
//       });
//     }

//     provider.isActive = !provider.isActive;
//     await provider.save();

//     console.log(`Provider ${provider._id} active status: ${provider.isActive}`);

//     return res.json({
//       success: true,
//       message: `Provider ${provider.isActive ? "activated" : "deactivated"}`,
//       data: { provider },
//     });
//   } catch (error) {
//     console.error("Toggle status error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// });
// // Delete provider (DELETE /api/providers/:id)
// router.delete(
//   "/:id",
//   // Temporarily disable authentication for testing
//   // authenticate,
//   // authorize('admin'),
//   async (req, res) => {
//     try {
//       const provider = await Provider.findById(req.params.id);

//       if (!provider) {
//         if (typeof errorResponse === "function") {
//           return errorResponse(res, "Provider not found", 404);
//         } else {
//           return res.status(404).json({
//             success: false,
//             message: "Provider not found",
//           });
//         }
//       }

//       await Provider.findByIdAndDelete(req.params.id);

//       if (typeof successResponse === "function") {
//         return successResponse(res, null, "Provider deleted successfully");
//       } else {
//         return res.json({
//           success: true,
//           message: "Provider deleted successfully",
//         });
//       }
//     } catch (error) {
//       console.error("Delete provider error:", error);
//       if (typeof errorResponse === "function") {
//         return errorResponse(res, "Error deleting provider", 500);
//       } else {
//         return res.status(500).json({
//           success: false,
//           message: "Error deleting provider",
//         });
//       }
//     }
//   }
// );

// export default router;
import express from "express";
import { body } from "express-validator";
import Provider from "../models/Provider.js";
import { authenticate, authorize } from "../middleware/auth.js";
import upload, { handleMulterError } from "../middleware/upload.js";
import { validateRequest } from "../utils/validation.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/responseFormatter.js";

const router = express.Router();

// Helper functions to safely convert values to the expected type
const safeParseInt = (value) => {
  console.log("safeParseInt input:", value, typeof value);

  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : Math.floor(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    value = value[0];
  }

  if (typeof value === "object") {
    console.warn("Unexpected object in safeParseInt:", value);
    return undefined;
  }

  const stringValue = String(value).trim();
  if (stringValue === "") return undefined;

  const parsed = parseInt(stringValue, 10);
  console.log("safeParseInt result:", parsed);

  return isNaN(parsed) ? undefined : parsed;
};

const safeParseFloat = (value) => {
  console.log("safeParseFloat input:", value, typeof value);

  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value === "number") {
    return isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    value = value[0];
  }

  if (typeof value === "object") {
    console.warn("Unexpected object in safeParseFloat:", value);
    return undefined;
  }

  const stringValue = String(value).trim();
  if (stringValue === "") return undefined;

  const parsed = parseFloat(stringValue);
  console.log("safeParseFloat result:", parsed);

  return isNaN(parsed) ? undefined : parsed;
};

const safeParseBoolean = (value) => {
  console.log("safeParseBoolean input:", value, typeof value);

  if (value === undefined || value === null) return undefined;

  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    value = value[0];
  }

  if (typeof value === "object") {
    console.warn("Unexpected object in safeParseBoolean:", value);
    return undefined;
  }

  const stringValue = String(value).toLowerCase().trim();

  if (stringValue === "true" || stringValue === "1" || stringValue === "yes")
    return true;
  if (stringValue === "false" || stringValue === "0" || stringValue === "no")
    return false;

  return undefined;
};

// Get all providers (GET /api/providers)
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      zone,
      isActive,
      isApproved,
      isFeatured,
      search,
    } = req.query;

    const filter = {};
    if (zone) filter.zone = zone;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isApproved !== undefined) filter.isApproved = isApproved === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: "i" } },
        { ownerFirstName: { $regex: search, $options: "i" } },
        { ownerLastName: { $regex: search, $options: "i" } },
      ];
    }

    const providers = await Provider.find(filter)
      .populate("zone", "name")
      .populate("categories", "name")
      .populate("approvedBy", "firstName lastName")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Provider.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    };

    if (typeof paginatedResponse === "function") {
      return paginatedResponse(
        res,
        { providers },
        pagination,
        "Providers fetched successfully"
      );
    } else {
      return res.json({
        success: true,
        message: "Providers fetched successfully",
        data: {
          providers,
          pagination,
        },
      });
    }
  } catch (error) {
    console.error("Get providers error:", error);
    if (typeof errorResponse === "function") {
      return errorResponse(res, "Error fetching providers", 500);
    } else {
      return res.status(500).json({
        success: false,
        message: "Error fetching providers",
      });
    }
  }
});

// Create new provider (POST /api/providers)
router.post(
  "/",
  authenticate,
  authorize('admin', 'manager'),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "tinCertificate", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "categoryImage", maxCount: 1 },
  ]),
  handleMulterError,
  [
    body("storeName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Store name must be 1-100 characters"),
    body("ownerEmail")
      .optional()
      .isEmail()
      .withMessage("Valid email is required"),
    body("latitude")
      .optional()
      .isFloat()
      .withMessage("Valid latitude is required"),
    body("longitude")
      .optional()
      .isFloat()
      .withMessage("Valid longitude is required"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("confirmPassword")
      .optional()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],
  validateRequest,
  async (req, res) => {
    try {
      console.log("=== CREATE PROVIDER DEBUG ===");
      console.log("Files received:", req.files);
      console.log("Body received:", req.body);

      const providerData = { ...req.body };

      if (req.files) {
        if (req.files.logo) {
          providerData.logo = req.files.logo[0].path.replace(/\\/g, "/");
        }
        if (req.files.coverImage) {
          providerData.coverImage = req.files.coverImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
        if (req.files.tinCertificate) {
          providerData.tinCertificate =
            req.files.tinCertificate[0].path.replace(/\\/g, "/");
        }
        if (req.files.bannerImage) {
          providerData.bannerImage = req.files.bannerImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
        if (req.files.categoryImage) {
          providerData.categoryImage = req.files.categoryImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
      }

      console.log("Provider data to save:", providerData);

      const cleanData = {};

      const stringFields = [
        "storeName",
        "ownerFirstName",
        "ownerLastName",
        "ownerEmail",
        "ownerPhone",
        "address",
        "storeAddress",
        "description",
        "logo",
        "coverImage",
        "tinCertificate",
        "bannerImage",
        "categoryImage",
        "zone",
        "businessTIN",
        "tinExpireDate",
        "ownerName",
        "businessName",
        "contactNumber",
        "email",
        "password",
        "confirmPassword"
      ];

      stringFields.forEach((field) => {
        if (
          providerData[field] !== undefined &&
          providerData[field] !== null &&
          providerData[field] !== ""
        ) {
          cleanData[field] = String(providerData[field]).trim();
        }
      });

      const numericFields = {
        latitude: "float",
        longitude: "float",
        estimatedDeliveryTime: "int",
        estimatedDeliveryTimeMax: "int",
        minimumDeliveryTime: "int",
        maximumDeliveryTime: "int",
        averageRating: "float",
        totalReviews: "int",
      };

      Object.keys(numericFields).forEach((field) => {
        const value = providerData[field];
        if (value !== undefined && value !== null && value !== "") {
          try {
            if (numericFields[field] === "float") {
              const parsed = safeParseFloat(value);
              if (parsed !== undefined) cleanData[field] = parsed;
            } else {
              const parsed = safeParseInt(value);
              if (parsed !== undefined) cleanData[field] = parsed;
            }
          } catch (error) {
            console.warn(`Failed to parse ${field}:`, error.message);
          }
        }
      });

      const booleanFields = ["isActive", "isApproved", "isFeatured"];
      booleanFields.forEach((field) => {
        const value = providerData[field];
        if (value !== undefined && value !== null) {
          try {
            const parsed = safeParseBoolean(value);
            if (parsed !== undefined) cleanData[field] = parsed;
          } catch (error) {
            console.warn(`Failed to parse boolean ${field}:`, error.message);
          }
        }
      });

      const finalProviderData = {
        ...cleanData,
        isActive: cleanData.isActive ?? true,
        isApproved: cleanData.isApproved ?? false,
        isFeatured: cleanData.isFeatured ?? false,
        averageRating: cleanData.averageRating ?? 0,
        totalReviews: cleanData.totalReviews ?? 0,
        storeName: cleanData.storeName || "Default Store Name",
        storeAddress:
          cleanData.storeAddress || cleanData.address || "Default Address",
        businessTIN: cleanData.businessTIN || "DEFAULT-TIN",
        tinExpireDate:
          cleanData.tinExpireDate ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        minimumDeliveryTime:
          cleanData.minimumDeliveryTime ||
          cleanData.estimatedDeliveryTime ||
          15,
        maximumDeliveryTime:
          cleanData.maximumDeliveryTime ||
          cleanData.estimatedDeliveryTimeMax ||
          45,
        estimatedDeliveryTime: cleanData.estimatedDeliveryTime || 15,
        estimatedDeliveryTimeMax: cleanData.estimatedDeliveryTimeMax || 45,
        categories: Array.isArray(providerData.categories)
          ? providerData.categories
          : providerData.categories
          ? [providerData.categories]
          : [],
        password: cleanData.password || "defaultPassword123",
        confirmPassword: cleanData.confirmPassword || "defaultPassword123"
      };

      Object.keys(finalProviderData).forEach((key) => {
        if (
          finalProviderData[key] === undefined ||
          finalProviderData[key] === null ||
          finalProviderData[key] === ""
        ) {
          delete finalProviderData[key];
        }
      });

      console.log("Final provider data with defaults:", finalProviderData);

      const provider = new Provider(finalProviderData);
      await provider.save();

      const populatedProvider = await Provider.findById(provider._id)
        .populate("zone", "name")
        .populate("categories", "name")
        .populate("approvedBy", "firstName lastName");

      return successResponse(
        res,
        { provider: populatedProvider },
        "Provider created successfully",
        201
      );
    } catch (error) {
      console.error("Create provider error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        errors: error.errors,
      });

      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return errorResponse(
          res,
          `Validation error: ${validationErrors.join(", ")}`,
          400
        );
      }

      return errorResponse(
        res,
        `Error creating provider: ${error.message}`,
        500
      );
    }
  }
);

// Get providers by zone (GET /api/providers/zone/:zoneId)
router.get("/zone/:zoneId", async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { isFeatured, isActive = true } = req.query;

    const filter = {
      zone: zoneId,
      isActive: isActive === "true",
      isApproved: true,
    };

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === "true";
    }

    const providers = await Provider.find(filter)
      .populate("zone", "name")
      .populate("categories", "name")
      .sort({ isFeatured: -1, averageRating: -1 });

    return successResponse(
      res,
      { providers },
      "Zone providers fetched successfully"
    );
  } catch (error) {
    console.error("Get providers by zone error:", error);
    return errorResponse(res, "Error fetching zone providers", 500);
  }
});

// Get provider by ID (GET /api/providers/:id)
router.get("/:id", async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate("zone", "name")
      .populate("categories", "name image")
      .populate("approvedBy", "firstName lastName");

    if (!provider) {
      return errorResponse(res, "Provider not found", 404);
    }

    return successResponse(
      res,
      { provider },
      "Provider fetched successfully"
    );
  } catch (error) {
    console.error("Get provider error:", error);
    return errorResponse(res, "Error fetching provider", 500);
  }
});

// Update provider (PUT /api/providers/:id)
router.put(
  "/:id",
  authenticate,
  authorize('admin', 'manager'),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "tinCertificate", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "categoryImage", maxCount: 1 },
  ]),
  handleMulterError,
  [
    body("storeName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Store name must be 1-100 characters"),
    body("ownerEmail")
      .optional()
      .isEmail()
      .withMessage("Valid email is required"),
    body("zone")
      .optional()
      .isMongoId()
      .withMessage("Valid zone ID is required"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("confirmPassword")
      .optional()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const provider = await Provider.findById(req.params.id);

      if (!provider) {
        return errorResponse(res, "Provider not found", 404);
      }

      const updateData = { ...req.body };

      if (updateData.latitude !== undefined) {
        updateData.latitude = safeParseFloat(updateData.latitude);
      }
      if (updateData.longitude !== undefined) {
        updateData.longitude = safeParseFloat(updateData.longitude);
      }
      if (updateData.estimatedDeliveryTime !== undefined) {
        updateData.estimatedDeliveryTime = safeParseInt(
          updateData.estimatedDeliveryTime
        );
      }
      if (updateData.estimatedDeliveryTimeMax !== undefined) {
        updateData.estimatedDeliveryTimeMax = safeParseInt(
          updateData.estimatedDeliveryTimeMax
        );
      }
      if (updateData.isActive !== undefined) {
        updateData.isActive = safeParseBoolean(updateData.isActive);
      }
      if (updateData.isApproved !== undefined) {
        updateData.isApproved = safeParseBoolean(updateData.isApproved);
      }
      if (updateData.isFeatured !== undefined) {
        updateData.isFeatured = safeParseBoolean(updateData.isFeatured);
      }

      if (req.files) {
        if (req.files.logo) {
          updateData.logo = req.files.logo[0].path.replace(/\\/g, "/");
        }
        if (req.files.coverImage) {
          updateData.coverImage = req.files.coverImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
        if (req.files.tinCertificate) {
          updateData.tinCertificate = req.files.tinCertificate[0].path.replace(
            /\\/g,
            "/"
          );
        }
        if (req.files.bannerImage) {
          updateData.bannerImage = req.files.bannerImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
        if (req.files.categoryImage) {
          updateData.categoryImage = req.files.categoryImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
      }

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedProvider = await Provider.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        { path: "zone", select: "name" },
        { path: "categories", select: "name" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      return successResponse(
        res,
        { provider: updatedProvider },
        "Provider updated successfully"
      );
    } catch (error) {
      console.error("Update provider error:", error);
      return errorResponse(res, "Error updating provider", 500);
    }
  }
);

router.patch("/:id/toggle-featured", async (req, res) => {
  try {
    console.log(`Toggle featured for provider: ${req.params.id}`);

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    provider.isFeatured = !provider.isFeatured;
    await provider.save();

    console.log(
      `Provider ${provider._id} featured status: ${provider.isFeatured}`
    );

    return res.json({
      success: true,
      message: `Provider ${provider.isFeatured ? "featured" : "unfeatured"}`,
      data: { provider },
    });
  } catch (error) {
    console.error("Toggle featured error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.patch("/:id/toggle-status", async (req, res) => {
  try {
    console.log(`Toggle status for provider: ${req.params.id}`);

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    provider.isActive = !provider.isActive;
    await provider.save();

    console.log(`Provider ${provider._id} active status: ${provider.isActive}`);

    return res.json({
      success: true,
      message: `Provider ${provider.isActive ? "activated" : "deactivated"}`,
      data: { provider },
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.delete(
  "/:id",
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const provider = await Provider.findById(req.params.id);

      if (!provider) {
        return errorResponse(res, "Provider not found", 404);
      }

      await Provider.findByIdAndDelete(req.params.id);

      return successResponse(res, null, "Provider deleted successfully");
    } catch (error) {
      console.error("Delete provider error:", error);
      return errorResponse(res, "Error deleting provider", 500);
    }
  }
);  

export default router;