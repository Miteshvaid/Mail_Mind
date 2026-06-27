const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const GmailAccount = require("../models/GmailAccount");

// Get all connected accounts
router.get("/", authMiddleware, async (req, res) => {
  try {
    const accounts = await GmailAccount.find({ userId: req.user._id });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Disconnect account
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await GmailAccount.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    res.json({ message: "Account disconnected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
