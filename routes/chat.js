const express = require("express");
const router = express.Router();
const Chat = require("../modules/chat");
const Booking = require("../modules/booking");
const authMiddleware = require("../modules/authMiddleware");

// Create or get chat for a booking
router.post("/chat", async (req, res) => {
  try {
    const { bookingId } = req.body;

    let chat = await Chat.findOne({ bookingId });

    if (!chat) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      chat = new Chat({
        bookingId,
        renterId: booking.renterId || booking.renterEmail, // Handle both cases
        ownerId: booking.ownerId,
      });

      await chat.save();
    }

    chat = await Chat.findById(chat._id)
      .populate("renterId", "name email phone")
      .populate("ownerId", "name email phone");

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message in chat
router.post("/chat/:chatId/message", async (req, res) => {
  try {
    const { senderId, message, messageType = "text" } = req.body;

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.messages.push({
      sender: senderId,
      message,
      messageType,
    });

    await chat.save();

    chat = await Chat.findById(chat._id)
      .populate("renterId", "name email phone")
      .populate("ownerId", "name email phone");

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update purchase details
router.put("/chat/:chatId/purchase", async (req, res) => {
  try {
    const { purchaseDetails } = req.body;

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.purchaseDetails = { ...chat.purchaseDetails, ...purchaseDetails };
    await chat.save();

    chat = await Chat.findById(chat._id)
      .populate("renterId", "name email phone")
      .populate("ownerId", "name email phone");

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all chats for a user
router.get("/chat/user/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [{ renterId: req.params.userId }, { ownerId: req.params.userId }],
    })
      .populate("bookingId")
      .populate("renterId", "name email")
      .populate("ownerId", "name email")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get specific chat
router.get("/chat/:chatId", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate("bookingId")
      .populate("renterId", "name email phone")
      .populate("ownerId", "name email phone");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
