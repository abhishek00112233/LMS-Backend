const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const User = require('./models/User');

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Nodemailer transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
});

/**
 * ROUTES
 */

// Test route
app.get('/', (req, res) => {
  res.send('LMS Backend is running');
});

// SEND OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { role, name, email, password } = req.body;

    if (!role || !name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    if (user) {
      user.role = role;
      user.name = name;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.isVerified = false;
      await user.save();
    } else {
      user = await User.create({
        role,
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        otp,
        otpExpires
      });
    }

    await transporter.sendMail({
      from: `"EduPlatform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your EduPlatform OTP Code',
      html: `<p>Your OTP for EduPlatform registration is <b>${otp}</b>. Valid for 5 minutes.</p>`
    });

    res.json({ message: 'OTP sent successfully to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error in sending OTP' });
  }
});

// VERIFY OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP expired.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: 'Account verified successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error in OTP verification' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { role, email, password } = req.body;

    if (!role || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or role' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before login.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error in login' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
