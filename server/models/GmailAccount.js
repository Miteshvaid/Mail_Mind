const mongoose = require("mongoose");

const gmailAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  appPassword: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastSync: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

gmailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("GmailAccount", gmailAccountSchema);
