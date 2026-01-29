const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Property = require("../modules/property");
const Booking = require("../modules/booking");
const authMiddleware = require("../modules/authMiddleware");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Get all properties
router.get("/", async (req, res) => {
  try {
    const properties = await Property.find().populate("owner", "name email");
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get properties by owner
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const properties = await Property.find({
      owner: req.params.ownerId,
    }).populate("owner", "name email");
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get property by ID
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "owner",
      "name email"
    );
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new property with file upload support
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "paymentScreenshot", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log("Received property creation request with body:", req.body);
    console.log("Files received:", req.files);
    console.log("User ID:", req.user.id); // Log the user ID for debugging
    try {
      const {
        title,
        description,
        type,
        location,
        price,
        bedrooms,
        bathrooms,
        area,
        amenities,
        securityDeposit,
        maintenanceCharges,
        furnished,
        parking,
        qrCode,
        ownerName,
        ownerPhone,
        ownerEmail,
      } = req.body;

      // Get owner from authenticated user
      const owner = req.user.id;

      // Parse amenities if it's a string
      const parsedAmenities =
        typeof amenities === "string" ? JSON.parse(amenities) : amenities;

      // Handle uploaded images
      let imageUrls = [];
      if (req.files && req.files.images && req.files.images.length > 0) {
        imageUrls = req.files.images.map((file) => `/uploads/${file.filename}`);
      }

      // Handle payment screenshot
      let paymentScreenshotUrl = null;
      if (
        req.files &&
        req.files.paymentScreenshot &&
        req.files.paymentScreenshot.length > 0
      ) {
        paymentScreenshotUrl = `/uploads/${req.files.paymentScreenshot[0].filename}`;
      }

      const property = new Property({
        owner,
        title,
        description,
        type,
        location,
        price: parseFloat(price),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: parseInt(area),
        images: imageUrls,
        rating: 0,
        amenities: parsedAmenities || [],
        securityDeposit: securityDeposit
          ? parseFloat(securityDeposit)
          : undefined,
        maintenanceCharges: maintenanceCharges
          ? parseFloat(maintenanceCharges)
          : undefined,
        furnished,
        parking,
        // Additional fields
        qrCode: qrCode || undefined,
        paymentScreenshot: paymentScreenshotUrl,
        ownerName: ownerName || undefined,
        ownerPhone: ownerPhone || undefined,
        ownerEmail: ownerEmail || undefined,
      });

      const newProperty = await property.save();
      res.status(201).json(newProperty);
    } catch (err) {
      console.error("Property creation error:", err);
      console.log("Request body:", req.body);
      console.log("Uploaded files:", req.files);
      res.status(400).json({
        message: err.message || "Failed to create property",
        details: err.errors,
      });
    }
  }
);

// Add new booking with file upload support
router.post(
  "/booking",
  upload.single("renterDocumentImage"),
  async (req, res) => {
    try {
      const {
        renterName,
        renterEmail,
        renterPhone,
        renterDocumentType,
        renterDocumentNumber,
        propertyId,
        additionalDetails,
      } = req.body;

      console.log("Received booking request with propertyId:", propertyId);
      console.log("Received files:", req.file);

      if (!propertyId) {
        return res.status(400).json({ message: "propertyId is required." });
      }

      // Trim propertyId to avoid issues with extra spaces
      const trimmedPropertyId = propertyId.trim();

      // Validate propertyId exists and get owner info
      const propertyExists = await Property.findById(trimmedPropertyId);
      if (!propertyExists) {
        return res
          .status(400)
          .json({ message: "Invalid propertyId: Property not found." });
      }

      // Handle uploaded document image
      let documentImageUrl = null;
      if (req.file) {
        documentImageUrl = `/uploads/${req.file.filename}`;
      }

      const booking = new Booking({
        renterName,
        renterEmail,
        renterPhone,
        renterDocumentType,
        renterDocumentNumber,
        propertyId: trimmedPropertyId,
        ownerId: propertyExists.owner,
        additionalDetails,
        renterDocumentImage: documentImageUrl,
      });

      const newBooking = await booking.save();
      res.status(201).json(newBooking);
    } catch (err) {
      console.error("Booking creation error:", err);
      res.status(400).json({ message: err.message });
    }
  }
);

// Get bookings for a specific owner
router.get("/bookings/owner/:ownerId", async (req, res) => {
  try {
    const bookings = await Booking.find({ ownerId: req.params.ownerId })
      .populate("propertyId", "title location price")
      .sort({ bookingDate: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get booking details with renter info
router.get("/bookings/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("propertyId", "title location price")
      .populate("ownerId", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
