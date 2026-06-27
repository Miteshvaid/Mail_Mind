const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const isGoogleOAuthConfigured = () => {
  return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
};

// Step 1: Google OAuth login start
router.get("/google", (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({
      message: "Google OAuth not configured",
    });
  }
  passport.authenticate("google")(req, res, next);
});

// Step 2: Google OAuth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    if (!isGoogleOAuthConfigured()) {
      return res.status(503).json({ message: "Google OAuth not configured" });
    }
    next();
  },
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  },
);

// ✅ FIXED: Add another Gmail account
router.get("/google/add-account", (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ message: "Google OAuth not configured" });
  }

  // ✅ JWT token se current user identify karo
  const authHeader = req.headers.authorization;
  let state = "add_account";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // User ID ko state mein encode karo
      state = JSON.stringify({ action: "add_account", userId: decoded.userId });
    } catch (err) {
      console.log("Invalid token, proceeding without user context");
    }
  }

  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    accessType: "offline",
    prompt: "consent",
    state: state,
  })(req, res, next);
});

// ✅ FIXED: Add Account Callback
// ✅ FIXED: Add another Gmail account
router.get("/google/add-account", (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ message: "Google OAuth not configured" });
  }

  // ✅ Token query param se lo (kyunki redirect mein header nahi jaata)
  const token = req.query.token;
  let state = "add_account";

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      state = JSON.stringify({ action: "add_account", userId: decoded.userId });
    } catch (err) {
      console.log("Invalid token, proceeding without user context");
    }
  }

  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    accessType: "offline",
    prompt: "consent",
    state: state,
  })(req, res, next);
});

// Logout
router.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out" });
  });
});

module.exports = router;
