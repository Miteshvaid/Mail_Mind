const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const syncService = require("../services/syncService");
const Email = require("../models/Email");

// Get emails for an account
router.get("/", authMiddleware, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.accountId) filter.accountId = req.query.accountId;
    if (req.query.category) filter.category = req.query.category;

    const emails = await Email.find(filter).sort({ receivedAt: -1 });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync emails manually
router.post("/sync/:accountId", authMiddleware, async (req, res) => {
  try {
    const result = await syncService.syncAccount(
      req.params.accountId,
      req.user._id,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark as read
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true },
    );
    res.json(email);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
