import express from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import upload, { handleMulterError } from "../middleware/upload.js";
import { validateRequest } from "../utils/validation.js";
import {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  incrementBannerClick,
} from "../controllers/bannerController.js";

const router = express.Router();

// Get all banners
router.get("/", getAllBanners);

// Get banner by ID
router.get("/:id", getBannerById);

// Create new banner
// In your banner routes file
// Create new banner
router.post(
  "/",
  authenticate,
  upload.single("bannerImage"),
  handleMulterError,
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title is required and must be 1-100 characters"),
    body("zone")
      .optional() // allow either ObjectId or name
      .trim()
      .isLength({ min: 1 })
      .withMessage("Zone must not be empty"),
    body("bannerType")
      .isIn(["default", "store_wise", "zone_wise"])
      .withMessage("Invalid banner type"),
    body("priority")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Priority must be a positive integer"),
  ],
  validateRequest,
  createBanner
);

// Update banner
router.put(
  "/:id",
  authenticate,
  authorize("admin", "manager"),
  upload.single("bannerImage"),
  handleMulterError,
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be 1-100 characters"),
    body("zone")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Zone must not be empty"),
    body("bannerType")
      .optional()
      .isIn(["default", "store_wise", "zone_wise"])
      .withMessage("Invalid banner type"),
    body("priority")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Priority must be a positive integer"),
  ],
  validateRequest,
  updateBanner
);

// Delete banner
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "manager"),
  deleteBanner
);

// Toggle banner status
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("admin", "manager"),
  toggleBannerStatus
);

// Increment banner click count
router.patch("/:id/click", incrementBannerClick);

export default router;