const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Email = require("../models/Email");
const {
  summarizeEmail,
  generateReplySuggestions,
} = require("../services/aiService");

// Regenerate summary
router.post("/summarize/:emailId", authMiddleware, async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.emailId,
      userId: req.user._id,
    });

    if (!email) return res.status(404).json({ message: "Email not found" });

    const summary = await summarizeEmail(email.subject, email.body);
    email.aiSummary = summary;
    await email.save();

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reply suggestions
router.get("/replies/:emailId", authMiddleware, async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.emailId,
      userId: req.user._id,
    });

    if (!email) return res.status(404).json({ message: "Email not found" });

    // Agar pehle se suggestions hain toh wahi return karo
    if (email.replySuggestions?.length > 0) {
      return res.json({ suggestions: email.replySuggestions });
    }

    // Naya generate karo
    const suggestions = await generateReplySuggestions(
      email.subject,
      email.body,
      email.from,
    );

    email.replySuggestions = suggestions;
    await email.save();

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
