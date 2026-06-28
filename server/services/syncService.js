const IMAPService = require("./imapService");
// ❌ DELETE: const gmailService = require('./gmailService');
const Email = require("../models/Email");
const aiService = require("./aiService");

class SyncService {
  async syncAccount(accountId, userId) {
    try {
      const GmailAccount = require("../models/GmailAccount");
      const account = await GmailAccount.findOne({ _id: accountId, userId });

      if (!account) throw new Error("Account not found");

      // ✅ Use IMAP instead of Gmail API
      const imap = new IMAPService(account.email, account.appPassword);
      const emails = await imap.fetchEmails(50);

      // Save to database with AI categorization
      for (const email of emails) {
        const category = await aiService.categorizeEmail(
          email.subject,
          email.body,
        );

        await Email.findOneAndUpdate(
          { accountId, gmailMessageId: email.id }, // ← gmailId → gmailMessageId
          {
            accountId,
            userId,
            gmailMessageId: email.id, // ← gmailId → gmailMessageId
            subject: email.subject,
            from: email.from,
            to: Array.isArray(email.to) ? email.to : [email.to],
            body: email.body,
            category: category,
            isRead: email.isRead,
            receivedAt: email.date, // ← date → receivedAt (model mein yahi hai)
          },
          { upsert: true, new: true },
        );
      }

      // Update last sync
      account.lastSync = new Date();
      await account.save();

      return { success: true, count: emails.length };
    } catch (error) {
      console.error("Sync error:", error);
      throw error;
    }
  }
}

module.exports = new SyncService();
