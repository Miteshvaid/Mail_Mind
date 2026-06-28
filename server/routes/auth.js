const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // ✅ Direct import karo
const User = require("../models/User");
const GmailAccount = require("../models/GmailAccount");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ REGISTER — With validation
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    console.log(
      "Register attempt:",
      email,
      "Password:",
      password ? "YES" : "NO",
    );

    // ✅ Strict validation
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email required" });
    }
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    // ✅ Hash password manually (backup)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    console.log("User created:", user._id, "Has password:", !!user.password);

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

// ✅ LOGIN — With validation
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", email, "Password:", password ? "YES" : "NO");

    // ✅ Strict validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log(
      "User found:",
      user._id,
      "Has password:",
      !!user.password,
      "Password length:",
      user.password?.length,
    );

    // ✅ Check if password exists
    if (!user.password) {
      return res
        .status(400)
        .json({ message: "Account has no password. Please register again." });
    }

    // ✅ Direct bcrypt compare (without method)
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

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

// ... rest same

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
