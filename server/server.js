const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// ✅ CORS
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.options("*", cors());

// ✅ BODY PARSER — YEH LINES HONI CHAHIYE!
app.use(express.json()); // JSON parse karo
app.use(express.urlencoded({ extended: true })); // Form data parse karo

// ✅ DEBUG — Request body log karo
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/api/accounts", require("./routes/accounts"));
app.use("/api/emails", require("./routes/emails"));
app.use("/api/ai", require("./routes/ai"));

// Health check
app.get("/health", (req, res) => res.json({ status: "OK" }));

// MongoDB Connect
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
