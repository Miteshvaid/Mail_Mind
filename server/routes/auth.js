const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const GmailAccount = require("../models/GmailAccount");
const IMAPService = require("../services/imapService");
const authMiddleware = require("../middleware/auth"); // ✅ ADD THIS
const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ REGISTER — NO auth needed
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ LOGIN — NO auth needed
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ ADD GMAIL — AUTH REQUIRED (isliye authMiddleware lagao!)
router.post("/add-gmail", authMiddleware, async (req, res) => {
  // ✅ ADD authMiddleware
  try {
    const { email, appPassword } = req.body;
    const userId = req.user._id; // ✅ Ab req.user defined hoga!

    // Test IMAP connection
    const imap = new IMAPService(email, appPassword);
    await imap.fetchEmails(1);

    // Save to DB
    await GmailAccount.findOneAndUpdate(
      { userId, email },
      { userId, email, appPassword, isActive: true, lastSync: new Date() },
      { upsert: true, new: true },
    );

    res.json({ message: "Gmail account added successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to connect: " + error.message });
  }
});

// ✅ LOGOUT — NO auth needed
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

module.exports = router;
