const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Email = require("../models/Email");
const GmailAccount = require("../models/GmailAccount");
const { syncUserEmails } = require("../services/syncService");

// Get all emails (unified inbox)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { category, accountId, search, priority } = req.query;

    const query = { userId: req.user._id };

    if (category && category !== "all") query.category = category;
    if (accountId) query.accountId = accountId;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { from: { $regex: search, $options: "i" } },
        { body: { $regex: search, $options: "i" } },
      ];
    }

    const emails = await Email.find(query)
      .populate("accountId", "email")
      .sort({ receivedAt: -1 })
      .limit(50);

    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single email
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("accountId", "email");

    if (!email) return res.status(404).json({ message: "Email not found" });

    // Mark as read
    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manual sync trigger
router.post("/sync", authMiddleware, async (req, res) => {
  try {
    // Async response - sync runs in background
    res.json({ message: "Sync started" });

    // Background sync
    syncUserEmails(req.user._id).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle star
router.patch("/:id/star", authMiddleware, async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!email) return res.status(404).json({ message: "Not found" });

    email.isStarred = !email.isStarred;
    await email.save();

    res.json({ isStarred: email.isStarred });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
