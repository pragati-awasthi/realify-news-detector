const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST: Save contact message
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const newMessage = new Contact({
      name,
      email,
      message
    });

    await newMessage.save();

    res.json({ success: true, message: "Message saved successfully" });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;