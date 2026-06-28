const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// ✅ SAHI — Multiple origins allow karo
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://mailmind-app.vercel.app",
  "https://mail-mind-woad.vercel.app", // ✅ Tera actual Vercel URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        console.log("CORS blocked:", origin); // Debug ke liye
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// ✅ Preflight requests handle karo
app.options("*", cors());

app.use(express.json());

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
