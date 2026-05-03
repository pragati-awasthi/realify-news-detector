const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    // Call Python API
    const response = await axios.post("https://realify-ml-api.onrender.com/predict", {
      text: text
    });

    // Send result back to frontend
    res.json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error analyzing news" });
  }
});

module.exports = router;