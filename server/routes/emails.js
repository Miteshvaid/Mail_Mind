const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const syncService = require("../services/syncService");
const Email = require("../models/Email");
const GmailAccount = require("../models/GmailAccount");
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
// Sabke accounts sync karo
router.post("/sync-all", authMiddleware, async (req, res) => {
  try {
    const accounts = await GmailAccount.find({
      userId: req.user._id,
      isActive: true,
    });

    const results = await Promise.all(
      accounts.map((acc) => syncService.syncAccount(acc._id, req.user._id)),
    );

    res.json({ message: "All accounts synced", results });
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
