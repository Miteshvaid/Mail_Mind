// server/services/syncService.js
const GmailAccount = require("../models/GmailAccount");
const Email = require("../models/Email");
const { fetchEmails } = require("./gmailService");
const {
  categorizeEmail,
  summarizeEmail,
  generateReplySuggestions,
  analyzePriority,
} = require("./aiService"); // ← Changed from claudeService to aiService

const syncAccountEmails = async (account, userId) => {
  try {
    console.log(`🔄 Syncing emails for ${account.email}...`);

    const emails = await fetchEmails(account, 30);

    for (const emailData of emails) {
      const existingEmail = await Email.findOne({
        gmailMessageId: emailData.gmailMessageId,
        accountId: account._id,
      });

      if (existingEmail) {
        existingEmail.isRead = emailData.isRead;
        existingEmail.isStarred = emailData.isStarred;
        await existingEmail.save();
        continue;
      }

      // 🎯 AI Categorization (Gemini/Groq/Rule-based)
      const categoryResult = await categorizeEmail(
        emailData.subject,
        emailData.body,
        emailData.from,
      );

      // ⚡ Priority Analysis
      const priorityResult = await analyzePriority(
        emailData.subject,
        emailData.body,
      );

      // 📋 AI Summary
      const summary = await summarizeEmail(emailData.subject, emailData.body);

      // 💬 Reply Suggestions
      const replies = await generateReplySuggestions(
        emailData.subject,
        emailData.body,
        emailData.from,
      );

      const newEmail = new Email({
        userId,
        accountId: account._id,
        ...emailData,
        category: categoryResult.category,
        categoryConfidence: categoryResult.confidence,
        priority: priorityResult.priority,
        hasDeadline: priorityResult.hasDeadline,
        deadlineDate: priorityResult.deadlineDate
          ? new Date(priorityResult.deadlineDate)
          : null,
        aiSummary: summary,
        replySuggestions: replies,
      });

      await newEmail.save();
      console.log(
        `✅ Saved: ${emailData.subject} → ${categoryResult.category}`,
      );
    }

    console.log(`✅ Sync complete for ${account.email}`);
  } catch (error) {
    console.error(`❌ Sync error for ${account.email}:`, error);
  }
};

const syncUserEmails = async (userId) => {
  const accounts = await GmailAccount.find({ userId, isActive: true });

  for (const account of accounts) {
    await syncAccountEmails(account, userId);
  }
};

module.exports = {
  syncAccountEmails,
  syncUserEmails,
};
