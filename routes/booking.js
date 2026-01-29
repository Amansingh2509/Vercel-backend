const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Booking = require("../modules/booking");
const Property = require("../modules/property");
const User = require("../modules/user");
const auth = require("../middleware/auth");
const { logBookingOperation, logBookingError } = require("../utils/logger");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Create booking with file uploads (protected route)
router.post(
  "/booking",
  auth,
  upload.fields([
    { name: "renterDocumentImage", maxCount: 1 },
    { name: "paymentProofImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const {
        renterName,
        renterEmail,
        renterPhone,
        renterDocumentType,
        renterDocumentNumber,
        propertyId,
        additionalDetails,
      } = req.body;

      // Log booking creation attempt
      logBookingOperation("booking_creation_attempt", null, userId, {
        propertyId,
        renterEmail,
      });

      // Validate required fields
      if (
        !renterName ||
        !renterEmail ||
        !renterPhone ||
        !renterDocumentType ||
        !renterDocumentNumber ||
        !propertyId
      ) {
        const error = new Error("All required fields must be provided");
        logBookingError("booking_validation_failed", null, userId, error, {
          missingFields: {
            renterName: !renterName,
            renterEmail: !renterEmail,
            renterPhone: !renterPhone,
            renterDocumentType: !renterDocumentType,
            renterDocumentNumber: !renterDocumentNumber,
            propertyId: !propertyId,
          },
        });

        return res.status(400).json({
          message: "All required fields must be provided",
          error: "VALIDATION_ERROR",
        });
      }

      // Validate property exists
      const property = await Property.findById(propertyId);
      if (!property) {
        const error = new Error("Property not found");
        logBookingError("booking_property_not_found", null, userId, error, {
          propertyId,
        });

        return res.status(404).json({
          message: "Property not found",
          error: "PROPERTY_NOT_FOUND",
        });
      }

      // Get owner ID from property
      const ownerId = property.owner;

      // Create booking object
      const bookingData = {
        renterName,
        renterEmail,
        renterPhone,
        renterDocumentType,
        renterDocumentNumber,
        propertyId,
        ownerId,
        additionalDetails: additionalDetails || "",
        status: "pending",
        createdBy: userId,
      };

      // Add file paths if files were uploaded
      if (req.files) {
        if (req.files.renterDocumentImage) {
          bookingData.renterDocumentImage =
            req.files.renterDocumentImage[0].filename;
        }
        if (req.files.paymentProofImage) {
          bookingData.paymentProofImage =
            req.files.paymentProofImage[0].filename;
        }
      }

      // Create and save booking
      const booking = new Booking(bookingData);
      await booking.save();

      // Populate the booking with property details for response
      await booking.populate("propertyId", "title location price");

      // Log successful booking creation
      logBookingOperation("booking_created", booking._id, userId, {
        propertyId,
        ownerId,
        status: booking.status,
      });

      res.status(201).json({
        message: "Booking submitted successfully",
        booking: {
          _id: booking._id,
          renterName: booking.renterName,
          renterEmail: booking.renterEmail,
          renterPhone: booking.renterPhone,
          renterDocumentType: booking.renterDocumentType,
          renterDocumentNumber: booking.renterDocumentNumber,
          property: booking.propertyId,
          additionalDetails: booking.additionalDetails,
          status: booking.status,
          createdAt: booking.createdAt,
        },
      });
    } catch (error) {
      logBookingError(
        "booking_creation_failed",
        null,
        req.user?.userId,
        error,
        {
          propertyId: req.body.propertyId,
        }
      );

      res.status(500).json({
        message: "Failed to create booking",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

// Get all bookings for a property owner
router.get("/owner/bookings", auth, async (req, res) => {
  try {
    const ownerId = req.user.userId;

    // Log owner bookings fetch attempt
    logBookingOperation("owner_bookings_fetch_attempt", null, ownerId);

    const bookings = await Booking.find({ ownerId })
      .populate("propertyId", "title location price")
      .sort({ createdAt: -1 });

    // Log successful owner bookings fetch
    logBookingOperation("owner_bookings_fetched", null, ownerId, {
      count: bookings.length,
    });

    res.json(bookings);
  } catch (error) {
    logBookingError(
      "owner_bookings_fetch_failed",
      null,
      req.user.userId,
      error
    );

    res.status(500).json({
      message: "Failed to fetch bookings",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

// Get booking by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const bookingId = req.params.id;

    // Log booking fetch attempt
    logBookingOperation("booking_fetch_attempt", bookingId, userId);

    const booking = await Booking.findById(bookingId)
      .populate("propertyId", "title location price")
      .populate("ownerId", "name email phone");

    if (!booking) {
      const error = new Error("Booking not found");
      logBookingError("booking_not_found", bookingId, userId, error);

      return res.status(404).json({
        message: "Booking not found",
        error: "BOOKING_NOT_FOUND",
      });
    }

    // Check if user has permission to view this booking
    if (booking.ownerId.toString() !== req.user.userId && !req.user.isAdmin) {
      const error = new Error("Access denied to booking");
      logBookingError("booking_access_denied", bookingId, userId, error, {
        ownerId: booking.ownerId.toString(),
        requesterId: userId,
      });

      return res.status(403).json({
        message: "Access denied",
        error: "ACCESS_DENIED",
      });
    }

    // Log successful booking fetch
    logBookingOperation("booking_fetched", bookingId, userId);

    res.json(booking);
  } catch (error) {
    logBookingError(
      "booking_fetch_failed",
      req.params.id,
      req.user.userId,
      error
    );

    res.status(500).json({
      message: "Failed to fetch booking",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

// Update booking status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.body;
    const bookingId = req.params.id;

    // Log booking status update attempt
    logBookingOperation("booking_status_update_attempt", bookingId, userId, {
      newStatus: status,
    });

    if (!["pending", "contacted", "confirmed", "cancelled"].includes(status)) {
      const error = new Error("Invalid status");
      logBookingError(
        "booking_status_update_invalid",
        bookingId,
        userId,
        error
      );

      return res.status(400).json({
        message: "Invalid status",
        error: "INVALID_STATUS",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error = new Error("Booking not found");
      logBookingError("booking_not_found", bookingId, userId, error);

      return res.status(404).json({
        message: "Booking not found",
        error: "BOOKING_NOT_FOUND",
      });
    }

    // Check if user has permission to update this booking
    if (booking.ownerId.toString() !== req.user.userId && !req.user.isAdmin) {
      const error = new Error("Access denied");
      logBookingError("booking_access_denied", bookingId, userId, error, {
        ownerId: booking.ownerId.toString(),
        requesterId: userId,
      });

      return res.status(403).json({
        message: "Access denied",
        error: "ACCESS_DENIED",
      });
    }

    booking.status = status;

    // Update notification timestamps
    if (status === "contacted" && !booking.ownerContacted) {
      booking.ownerContacted = true;
      booking.ownerNotifiedAt = new Date();
    }

    await booking.save();

    // Log successful booking status update
    logBookingOperation("booking_status_updated", bookingId, userId, {
      newStatus: booking.status,
    });

    res.json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (error) {
    logBookingError(
      "booking_status_update_failed",
      req.params.id,
      req.user.userId,
      error
    );

    res.status(500).json({
      message: "Failed to update booking status",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

// Get bookings for a specific property
router.get("/property/:propertyId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const propertyId = req.params.propertyId;

    // Log property bookings fetch attempt
    logBookingOperation("property_bookings_fetch_attempt", null, userId, {
      propertyId,
    });

    const bookings = await Booking.find({ propertyId })
      .populate("propertyId", "title location price")
      .sort({ createdAt: -1 });

    // Log successful property bookings fetch
    logBookingOperation("property_bookings_fetched", null, userId, {
      propertyId,
      count: bookings.length,
    });

    res.json(bookings);
  } catch (error) {
    logBookingError(
      "property_bookings_fetch_failed",
      null,
      req.user.userId,
      error,
      {
        propertyId: req.params.propertyId,
      }
    );

    res.status(500).json({
      message: "Failed to fetch property bookings",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

module.exports = router;
