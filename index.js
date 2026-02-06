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

// Configure CORS
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
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
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
  console.error("Error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Roomyy API Server",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      properties: "/api/properties",
      users: "/api/users",
      chat: "/api/chat",
      bookings: "/api/bookings",
      contact: "/api/contact",
      health: "/health",
    },
  });
});

// Health check endpoint - works without DB
app.get("/health", async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    res.status(200).json({
      status: "OK",
      database: mongoState === 1 ? "connected" : "disconnected",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Export for Vercel
module.exports = app;

// Local development
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5002;
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (mongoUri) {
    mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      })
      .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => console.log(`Server running on ${PORT}`));
      })
      .catch((err) => {
        console.error("DB connection failed:", err.message);
        app.listen(PORT, () =>
          console.log(`Server running on ${PORT} (no DB)`),
        );
      });
  } else {
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  }
}
