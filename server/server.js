const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// ✅ STEP 1: CORS (sabse pehle)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.options("*", cors());

// ✅ STEP 2: BODY PARSER (CORS ke baad, routes se pehle!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ STEP 3: DEBUG (routes se pehle)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

// ✅ STEP 4: ROUTES (sabse baad mein!)
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
