const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  picture: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// ✅ NO pre-save hook (hash in route instead)
// ✅ NO methods (use bcrypt directly in route)

module.exports = mongoose.model("User", userSchema);
