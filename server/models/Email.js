const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GmailAccount",
    required: true,
  },

  // Gmail API se aaya data
  gmailMessageId: { type: String, required: true },
  threadId: { type: String },

  // Email details
  from: { type: String, required: true },
  fromName: { type: String },
  to: [{ type: String }],
  subject: { type: String, default: "(No Subject)" },
  body: { type: String }, // Plain text body
  bodyHtml: { type: String }, // HTML body
  snippet: { type: String }, // Gmail ka short preview

  // AI Categorization
  category: {
    type: String,
    enum: ["Jobs", "College", "Shopping", "Personal", "Spam", "Uncategorized"],
    default: "Uncategorized",
  },
  categoryConfidence: { type: Number, default: 0 },

  // Smart Highlights
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "low",
  },
  hasDeadline: { type: Boolean, default: false },
  deadlineDate: { type: Date },

  // AI Summary
  aiSummary: { type: String },

  // AI Reply Suggestions
  replySuggestions: [{ type: String }],

  // Email metadata
  isRead: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  isImportant: { type: Boolean, default: false },
  labels: [{ type: String }],
  receivedAt: { type: Date, required: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for fast queries
emailSchema.index({ userId: 1, receivedAt: -1 });
emailSchema.index({ userId: 1, category: 1 });
emailSchema.index({ userId: 1, accountId: 1 });
emailSchema.index({ gmailMessageId: 1, accountId: 1 }, { unique: true });

module.exports = mongoose.model("Email", emailSchema);
