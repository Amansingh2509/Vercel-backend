const express = require("express");
const router = express.Router();
const User = require("../modules/user");

// GET all users - for testing and getting valid user IDs
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "_id name email userType");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

module.exports = router;
