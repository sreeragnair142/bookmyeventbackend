import express from "express";
import { body } from "express-validator";
import Auditorium from "../models/audi.js";
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

// Get all auditoriums (GET /api/auditoriums)
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

    const auditoriums = await Auditorium.find(filter)
      .populate("zone", "name")
      .populate("categories", "name")
      .populate("approvedBy", "firstName lastName")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Auditorium.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    };

    if (typeof paginatedResponse === "function") {
      return paginatedResponse(
        res,
        { auditoriums },
        pagination,
        "Auditoriums fetched successfully"
      );
    } else {
      return res.json({
        success: true,
        message: "Auditoriums fetched successfully",
        data: {
          auditoriums,
          pagination,
        },
      });
    }
  } catch (error) {
    console.error("Get auditoriums error:", error);
    if (typeof errorResponse === "function") {
      return errorResponse(res, "Error fetching auditoriums", 500);
    } else {
      return res.status(500).json({
        success: false,
        message: "Error fetching auditoriums",
      });
    }
  }
});

// Create new auditorium (POST /api/auditoriums)
router.post(
  "/",
  // authenticate,
  // authorize('admin', 'manager'),
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
  ],
  // validateRequest,
  async (req, res) => {
    try {
      console.log("=== CREATE AUDITORIUM DEBUG ===");
      console.log("Files received:", req.files);
      console.log("Body received:", req.body);

      const auditoriumData = { ...req.body };

      if (req.files) {
        if (req.files.logo) {
          auditoriumData.logo = req.files.logo[0].path.replace(/\\/g, "/");
        }
        if (req.files.coverImage) {
          auditoriumData.coverImage = req.files.coverImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
        if (req.files.tinCertificate) {
          auditoriumData.tinCertificate =
            req.files.tinCertificate[0].path.replace(/\\/g, "/");
        }
        if (req.files.bannerImage) {
          auditoriumData.bannerImage = req.files.bannerImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
        if (req.files.categoryImage) {
          auditoriumData.categoryImage = req.files.categoryImage[0].path.replace(
            /\\/g,
            "/"
          );
        }
      }

      console.log("Auditorium data to save:", auditoriumData);
      console.log("Data types check:");
      console.log(
        "estimatedDeliveryTime:",
        typeof auditoriumData.estimatedDeliveryTime,
        auditoriumData.estimatedDeliveryTime
      );
      console.log(
        "estimatedDeliveryTimeMax:",
        typeof auditoriumData.estimatedDeliveryTimeMax,
        auditoriumData.estimatedDeliveryTimeMax
      );
      console.log(
        "latitude:",
        typeof auditoriumData.latitude,
        auditoriumData.latitude
      );
      console.log(
        "longitude:",
        typeof auditoriumData.longitude,
        auditoriumData.longitude
      );

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
      ];

      stringFields.forEach((field) => {
        if (
          auditoriumData[field] !== undefined &&
          auditoriumData[field] !== null &&
          auditoriumData[field] !== ""
        ) {
          cleanData[field] = String(auditoriumData[field]).trim();
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
        const value = auditoriumData[field];
        console.log(`Processing ${field}:`, value, typeof value);

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
        const value = auditoriumData[field];
        if (value !== undefined && value !== null) {
          try {
            const parsed = safeParseBoolean(value);
            if (parsed !== undefined) cleanData[field] = parsed;
          } catch (error) {
            console.warn(`Failed to parse boolean ${field}:`, error.message);
          }
        }
      });

      const finalAuditoriumData = {
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

        categories: Array.isArray(auditoriumData.categories)
          ? auditoriumData.categories
          : auditoriumData.categories
          ? [auditoriumData.categories]
          : [],
      };

      Object.keys(finalAuditoriumData).forEach((key) => {
        if (
          finalAuditoriumData[key] === undefined ||
          finalAuditoriumData[key] === null ||
          finalAuditoriumData[key] === ""
        ) {
          delete finalAuditoriumData[key];
        }
      });

      console.log("Final auditorium data with defaults:", finalAuditoriumData);
      console.log("Required fields check:");
      console.log("- storeName:", finalAuditoriumData.storeName);
      console.log("- storeAddress:", finalAuditoriumData.storeAddress);
      console.log("- businessTIN:", finalAuditoriumData.businessTIN);
      console.log("- tinExpireDate:", finalAuditoriumData.tinExpireDate);
      console.log(
        "- minimumDeliveryTime:",
        finalAuditoriumData.minimumDeliveryTime
      );
      console.log(
        "- maximumDeliveryTime:",
        finalAuditoriumData.maximumDeliveryTime
      );

      const auditorium = new Auditorium(finalAuditoriumData);
      await auditorium.save();

      const populatedAuditorium = await Auditorium.findById(auditorium._id)
        .populate("zone", "name")
        .populate("categories", "name")
        .populate("approvedBy", "firstName lastName");

      if (typeof successResponse === "function") {
        return successResponse(
          res,
          { auditorium: populatedAuditorium },
          "Auditorium created successfully",
          201
        );
      } else {
        return res.status(201).json({
          success: true,
          message: "Auditorium created successfully",
          data: { auditorium: populatedAuditorium },
        });
      }
    } catch (error) {
      console.error("Create auditorium error:", error);
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
        if (typeof errorResponse === "function") {
          return errorResponse(
            res,
            `Validation error: ${validationErrors.join(", ")}`,
            400
          );
        } else {
          return res.status(400).json({
            success: false,
            message: `Validation error: ${validationErrors.join(", ")}`,
            errors: validationErrors,
          });
        }
      }

      if (typeof errorResponse === "function") {
        return errorResponse(
          res,
          `Error creating auditorium: ${error.message}`,
          500
        );
      } else {
        return res.status(500).json({
          success: false,
          message: `Error creating auditorium: ${error.message}`,
          error: error.toString(),
        });
      }
    }
  }
);

// Get auditoriums by zone (GET /api/auditoriums/zone/:zoneId)
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

    const auditoriums = await Auditorium.find(filter)
      .populate("zone", "name")
      .populate("categories", "name")
      .sort({ isFeatured: -1, averageRating: -1 });

    if (typeof successResponse === "function") {
      return successResponse(
        res,
        { auditoriums },
        "Zone auditoriums fetched successfully"
      );
    } else {
      return res.json({
        success: true,
        message: "Zone auditoriums fetched successfully",
        data: { auditoriums },
      });
    }
  } catch (error) {
    console.error("Get auditoriums by zone error:", error);
    if (typeof errorResponse === "function") {
      return errorResponse(res, "Error fetching zone auditoriums", 500);
    } else {
      return res.status(500).json({
        success: false,
        message: "Error fetching zone auditoriums",
      });
    }
  }
});

// Get auditorium by ID (GET /api/auditoriums/:id)
router.get("/:id", async (req, res) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id)
      .populate("zone", "name")
      .populate("categories", "name image")
      .populate("approvedBy", "firstName lastName");

    if (!auditorium) {
      if (typeof errorResponse === "function") {
        return errorResponse(res, "Auditorium not found", 404);
      } else {
        return res.status(404).json({
          success: false,
          message: "Auditorium not found",
        });
      }
    }

    if (typeof successResponse === "function") {
      return successResponse(
        res,
        { auditorium },
        "Auditorium fetched successfully"
      );
    } else {
      return res.json({
        success: true,
        message: "Auditorium fetched successfully",
        data: { auditorium },
      });
    }
  } catch (error) {
    console.error("Get auditorium error:", error);
    if (typeof errorResponse === "function") {
      return errorResponse(res, "Error fetching auditorium", 500);
    } else {
      return res.status(500).json({
        success: false,
        message: "Error fetching auditorium",
      });
    }
  }
});

// Update auditorium (PUT /api/auditoriums/:id)
router.put(
  "/:id",
  // authenticate,
  // authorize('admin', 'manager'),
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
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const auditorium = await Auditorium.findById(req.params.id);

      if (!auditorium) {
        if (typeof errorResponse === "function") {
          return errorResponse(res, "Auditorium not found", 404);
        } else {
          return res.status(404).json({
            success: false,
            message: "Auditorium not found",
          });
        }
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

      const updatedAuditorium = await Auditorium.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        { path: "zone", select: "name" },
        { path: "categories", select: "name" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      if (typeof successResponse === "function") {
        return successResponse(
          res,
          { auditorium: updatedAuditorium },
          "Auditorium updated successfully"
        );
      } else {
        return res.json({
          success: true,
          message: "Auditorium updated successfully",
          data: { auditorium: updatedAuditorium },
        });
      }
    } catch (error) {
      console.error("Update auditorium error:", error);
      if (typeof errorResponse === "function") {
        return errorResponse(res, "Error updating auditorium", 500);
      } else {
        return res.status(500).json({
          success: false,
          message: "Error updating auditorium",
        });
      }
    }
  }
);

// Toggle auditorium status (PATCH /api/auditoriums/:id/toggle-status)
router.patch("/:id/toggle-featured", async (req, res) => {
  try {
    console.log(`Toggle featured for auditorium: ${req.params.id}`);

    const auditorium = await Auditorium.findById(req.params.id);
    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: "Auditorium not found",
      });
    }

    auditorium.isFeatured = !auditorium.isFeatured;
    await auditorium.save();

    console.log(
      `Auditorium ${auditorium._id} featured status: ${auditorium.isFeatured}`
    );

    return res.json({
      success: true,
      message: `Auditorium ${auditorium.isFeatured ? "featured" : "unfeatured"}`,
      data: { auditorium },
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
    console.log(`Toggle status for auditorium: ${req.params.id}`);

    const auditorium = await Auditorium.findById(req.params.id);
    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: "Auditorium not found",
      });
    }

    auditorium.isActive = !auditorium.isActive;
    await auditorium.save();

    console.log(`Auditorium ${auditorium._id} active status: ${auditorium.isActive}`);

    return res.json({
      success: true,
      message: `Auditorium ${auditorium.isActive ? "activated" : "deactivated"}`,
      data: { auditorium },
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Delete auditorium (DELETE /api/auditoriums/:id)
router.delete(
  "/:id",
  // authenticate,
  // authorize('admin'),
  async (req, res) => {
    try {
      const auditorium = await Auditorium.findById(req.params.id);

      if (!auditorium) {
        if (typeof errorResponse === "function") {
          return errorResponse(res, "Auditorium not found", 404);
        } else {
          return res.status(404).json({
            success: false,
            message: "Auditorium not found",
          });
        }
      }

      await Auditorium.findByIdAndDelete(req.params.id);

      if (typeof successResponse === "function") {
        return successResponse(res, null, "Auditorium deleted successfully");
      } else {
        return res.json({
          success: true,
          message: "Auditorium deleted successfully",
        });
      }
    } catch (error) {
      console.error("Delete auditorium error:", error);
      if (typeof errorResponse === "function") {
        return errorResponse(res, "Error deleting auditorium", 500);
      } else {
        return res.status(500).json({
          success: false,
          message: "Error deleting auditorium",
        });
      }
    }
  }
);

export default router;