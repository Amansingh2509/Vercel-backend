const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error(
    "JWT_SECRET is not set in environment variables. Please set it in .env file."
  );
  process.exit(1);
}

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/property");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const bookingRoutes = require("./routes/booking");
const contactRoutes = require("./routes/contact");

const app = express();

// Configure CORS to allow frontend requests
const corsOptions = {
  origin: [
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5002",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests
app.options("*", cors(corsOptions));

// Increase payload size for file uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5002;
const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://2203031050640:asdfghjkl@cluster0.2llhzuj.mongodb.net/database";

if (!mongoUri) {
  console.error("MongoDB URI not found in environment variables");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
