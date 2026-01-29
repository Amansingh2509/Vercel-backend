const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["Bungalow", "Flat", "Tenement"],
      required: true,
    },
    location: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    area: { type: Number, required: true, min: 0 },
    images: [{ type: String }], // Changed from single image to array
    rating: { type: Number, default: 0, min: 0, max: 5 },
    amenities: [{ type: String, trim: true }],
    securityDeposit: { type: Number, min: 0 },
    maintenanceCharges: { type: Number, min: 0 },
    furnished: {
      type: String,
      enum: ["Furnished", "Semi-Furnished", "Unfurnished"],
    },
    parking: {
      type: String,
      enum: ["Available", "Not Available"],
    },
    isAvailable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["available", "booked", "sold", "pending"],
      default: "available",
    },
    bookingCount: { type: Number, default: 0 },
    // Additional fields from frontend form
    qrCode: { type: String, trim: true },
    paymentScreenshot: { type: String }, // URL to uploaded payment screenshot
    ownerName: { type: String, trim: true },
    ownerPhone: { type: String, trim: true },
    ownerEmail: { type: String, trim: true },
  },
  { timestamps: true }
);

// Index for better query performance
propertySchema.index({ location: "text", title: "text", description: "text" });
propertySchema.index({ price: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ owner: 1 });

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
