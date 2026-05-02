const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios"); 
require("dotenv").config();
const app = express();  

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/realify")
.then(() => console.log("MongoDB Connected to realify"))
.catch(err => console.log(err));

// Import routes
const analyzeRoutes = require("./routes/analyze");
const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contactRoutes");

// Use routes
app.use("/api/analyze", analyzeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", contactRoutes);

// ==============================
// 🔥 ML ROUTE (VERY IMPORTANT)
// ==============================
app.post("/api/predict", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // 👉 Call Flask API
    const response = await axios.post("http://127.0.0.1:5001/predict", {
      text: text
    });

    // 👉 Send ML result back to frontend
    res.json(response.data);

  } catch (error) {
    console.error("ML ERROR:", error.message);
    res.status(500).json({ error: "AI server error" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});