const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const GmailAccount = require("../models/GmailAccount");
const authMiddleware = require("../middleware/auth");
const router = express.Router();
const IMAPService = require("../services/imapService");
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    console.log("=== LOGIN REQUEST ===");
    console.log("Headers:", req.headers["content-type"]);
    console.log("Body:", req.body);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("====================");

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
        received: req.body, // Debug info
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.password) {
      await User.deleteOne({ _id: user._id });
      return res
        .status(400)
        .json({ message: "Old account. Please register again." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ REGISTER
router.post("/register", async (req, res) => {
  try {
    console.log("=== REGISTER REQUEST ===");
    console.log("Headers:", req.headers["content-type"]);
    console.log("Body:", req.body);
    console.log("====================");

    const { email, password, name } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
        received: req.body, // Debug info
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      // Delete old user if no password
      if (!existing.password) {
        await User.deleteOne({ _id: existing._id });
      } else {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ email, password: hashedPassword, name });

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ... rest same
// ... rest same

// ✅ ADD GMAIL — AUTH REQUIRED (isliye authMiddleware lagao!)
router.post("/add-gmail", authMiddleware, async (req, res) => {
  // ✅ ADD authMiddleware
  try {
    const { email, appPassword } = req.body;
    const userId = req.user._id; // ✅ Ab req.user defined hoga!

    // Test IMAP connection
    // const imap = new IMAPService(email, appPassword);
    // await imap.fetchEmails(1);

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
