const mongoose = require("mongoose");

const gmailAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  googleId: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiry: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index - ek user ke paas same email do baar nahi
gmailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("GmailAccount", gmailAccountSchema);
