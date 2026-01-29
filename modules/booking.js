const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    renterName: { type: String, required: true },
    renterEmail: { type: String, required: true },
    renterPhone: { type: String, required: true },
    renterDocumentType: { type: String, required: true },
    renterDocumentNumber: { type: String, required: true },
    renterDocumentImage: { type: String },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingDate: { type: Date, default: Date.now },
    additionalDetails: { type: String },
    status: {
      type: String,
      enum: ["pending", "contacted", "confirmed", "cancelled"],
      default: "pending",
    },
    notificationSent: { type: Boolean, default: false },
    ownerNotifiedAt: { type: Date },
    ownerContacted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Index for better query performance
bookingSchema.index({ propertyId: 1 });
bookingSchema.index({ ownerId: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
