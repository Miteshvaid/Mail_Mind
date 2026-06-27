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
    return res.status(503).json({ message: "Google OAuth not configured" });
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
  })(req, res, next);
});

// Step 2: Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const stateRaw = req.query.state;
      let state = null;

      try {
        state = JSON.parse(stateRaw);
      } catch (_) {}

      // Add account flow — existing user ke saath link karo
      if (state?.action === "add_account" && state?.userId) {
        const GmailAccount = require("../models/GmailAccount");

        // Naye logged-in account ki email lo
        const newEmail = req.user.email;

        // Existing GmailAccount ko sahi userId se link karo
        await GmailAccount.findOneAndUpdate(
          { email: newEmail },
          { userId: state.userId },
          { new: true },
        );

        // Original user ka token banao (naye user ka nahi!)
        const token = generateToken(state.userId);
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?token=${token}`,
        );
      }

      // Normal login flow
      const token = generateToken(req.user._id);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect("/login");
    }
  },
);

// Add another Gmail account
router.get("/google/add-account", (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ message: "Google OAuth not configured" });
  }

  const token = req.query.token;
  let state = "add_account";

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      state = JSON.stringify({
        action: "add_account",
        userId: decoded.userId,
      });
    } catch (err) {
      console.log("Invalid token");
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
