const express = require("express");
const router = express.Router();
const User = require("../models/User");
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "realify.newschecker@gmail.com",
    pass: "czaryrfpsekasriu"
  }
});

// ✅ SIGNUP API
router.post("/signup", async (req, res) => {
  console.log("👉 Signup API called");

  try {
    const { firstName, lastName, email, password } = req.body;

    // check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "Email already registered"
      });
    }

    // create user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password
    });

    await newUser.save();

    res.json({
      success: true,
      message: "User registered successfully"
    });

  } catch (err) {
    console.log("❌ Signup Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ✅ LOGIN API
router.post("/login", async (req, res) => {
  console.log("👉 Login API called");

  try {
    // ✅ ADD THESE 3 LINES
    console.log("📩 Full Body:", req.body);

    const { email, password } = req.body;

    console.log("📧 Email received:", email);

    // find user
    const user = await User.findOne({ email });

    console.log("👤 User found:", user);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    if (user.password !== password) {
      return res.json({
        success: false,
        message: "Invalid password"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        name: user.firstName + " " + user.lastName,
        email: user.email
      }
    });

  } catch (err) {
    console.log("❌ Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "Email not registered"
      });
    }

    // ✅ generate new password
    const newPassword = Math.random().toString(36).slice(-8);

    // update in DB
    user.password = newPassword;
    await user.save();

    // send email
    await transporter.sendMail({
      from: "your_email@gmail.com",
      to: email,
      subject: "Realify Password Reset",
      text: `Your new password is: ${newPassword}`
    });

    res.json({
      success: true,
      message: "New password sent to your email"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error sending email"
    });
  }
});
module.exports = router;