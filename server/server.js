require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

const connectDB = require("./config/database");
require("./config/passport");

const authRoutes = require("./routes/auth");
const emailRoutes = require("./routes/emails");
const aiRoutes = require("./routes/ai");
const accountRoutes = require("./routes/accounts");
const errorHandler = require("./middleware/errorHandler");

const { syncUserEmails } = require("./services/syncService");

const app = express();
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: .env file not loaded! Make sure .env exists in server folder.');
  process.exit(1);
}
// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true for HTTPS
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/accounts", accountRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date(), uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 MailMind Server running on port ${PORT}`);
    console.log(`📧 Health Check: http://localhost:${PORT}/health`);
  });
});
