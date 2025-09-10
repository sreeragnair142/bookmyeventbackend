import express from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import upload, { handleMulterError } from "../middleware/upload.js";
import { validateRequest } from "../utils/validation.js";
import {
  getAllAuditoriumBanners,
  getAuditoriumBannerById,
  createAuditoriumBanner,
  updateAuditoriumBanner,
  deleteAuditoriumBanner,
  toggleAuditoriumBannerStatus,
  incrementAuditoriumBannerClick,
} from "../controllers/audibannerController.js";

const router = express.Router();

// Get all auditorium banners
router.get("/", getAllAuditoriumBanners);

// Get auditorium banner by ID
router.get("/:id", getAuditoriumBannerById);

// Create new auditorium banner
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
      .optional()
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
  createAuditoriumBanner
);

// Update auditorium banner
router.put(
  "/:id",
  authenticate,
  authorize("admin", "manager", "superadmin", "user", "editor"),
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
  updateAuditoriumBanner
);

// Delete auditorium banner
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "manager", "superadmin", "user", "editor"),
  deleteAuditoriumBanner
);

// Toggle auditorium banner status
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("admin", "manager", "superadmin", "user", "editor"),
  toggleAuditoriumBannerStatus
);

// Increment auditorium banner click count (no auth needed for analytics)
router.patch("/:id/click", incrementAuditoriumBannerClick);

export default router;