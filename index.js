const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

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
    "https://roomyy-frontend.vercel.app",
    "https://roomyy.vercel.app",
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// MongoDB connection caching for serverless environment
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log("Using cached MongoDB connection");
    return;
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MongoDB URI not found in environment variables");
    throw new Error("MongoDB URI not found");
  }

  console.log("Connecting to MongoDB...");

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  }
};

// Export app for Vercel
module.exports = app;

// For local development
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5002;

  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}

// For Vercel serverless - establish connection on each request
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectToDatabase();
    } catch (err) {
      return res.status(500).json({ message: "Database connection failed" });
    }
  }
  next();
});
