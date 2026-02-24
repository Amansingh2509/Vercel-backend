const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../modules/user.js");
const router = express.Router();

// Helper to check database connection and try to connect if not
const checkDbConnection = async () => {
  // If already connected, return true
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // If we have MONGO_URI, try to connect
  if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log("MongoDB connected on-demand");
      return true;
    } catch (err) {
      console.error("On-demand MongoDB connection failed:", err.message);
      return false;
    }
  }

  return false;
};

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, userType } = req.body;

  // Check if database is connected
  const isConnected = await checkDbConnection();
  if (!isConnected) {
    return res.status(503).json({
      message:
        "Database not connected. Please ensure MONGO_URI environment variable is set in Vercel project settings.",
    });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Creating user with data:", {
      name,
      email,
      password,
      userType,
    });
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      userType,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Check if database is connected
  const isConnected = await checkDbConnection();
  if (!isConnected) {
    return res.status(503).json({
      message:
        "Database not connected. Please ensure MONGO_URI environment variable is set in Vercel project settings.",
    });
  }

  try {
    const user = await User.findOne({ email });
    console.log("User found:", user);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and generate new token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token: newToken });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
