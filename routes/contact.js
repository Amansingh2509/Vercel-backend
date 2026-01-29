const express = require("express");
const router = express.Router();
const Contact = require("../modules/contact");

// POST route to handle contact form submissions
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate incoming data
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create a new contact entry
    const newContact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
    });

    await newContact.save();
    res.status(201).json({ message: "Contact form submitted successfully." });
  } catch (err) {
    console.error("Error saving contact form:", err);
    res.status(500).json({ message: "Failed to submit contact form." });
  }
});

module.exports = router;
