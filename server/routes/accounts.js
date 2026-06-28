const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const GmailAccount = require("../models/GmailAccount");
const IMAPService = require("../services/imapService");

// Get all connected accounts
router.get("/", authMiddleware, async (req, res) => {
  try {
    const accounts = await GmailAccount.find({ userId: req.user._id });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch emails from IMAP
router.get("/:id/emails", authMiddleware, async (req, res) => {
  try {
    const account = await GmailAccount.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!account) return res.status(404).json({ message: "Account not found" });

    const imap = new IMAPService(account.email, account.appPassword);
    const emails = await imap.fetchEmails(50);

    account.lastSync = new Date();
    await account.save();

    res.json(emails);
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
