require('dotenv').config();
require("dns").setDefaultResultOrder("ipv4first");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.error("Database connection error:", err));

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});
const User = mongoose.model("User", UserSchema);

const WorkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  service: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true },
  startHeur: { type: String, required: true },
  startMin: { type: String, required: true },
  heur: { type: Number, required: true },
  min: { type: Number, required: true },
  currentHeur: { type: String, required: true },
  currentMin: { type: String, required: true }
}, { timestamps: true });

const WorkSession = mongoose.model("WorkSession", WorkSchema);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access token missing or unauthorized" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: "error", message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ status: "success", message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  console.log("Login attempt:", req.body.email);
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log("User found:", user ? "yes" : "no");

    if (!user) {
      return res.status(401).json({ status: "error", message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: "error", message: "Invalid email or password" });
    }

    console.log("SECRET_KEY exists:", !!SECRET_KEY);
    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: "7d" });
    res.json({ status: "success", token, name: user.name });
  } catch (error) {
    console.error("Login error details:", error.message, error.stack);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
port: 465,
secure: true,
family: 4,
connectionTimeout: 15000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset",
      html: `
        <div style="font-family: Arial; text-align: left;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password. Click the link below:</p>
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>This link is valid for 1 hour only.</p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `
    });

    res.json({ status: "success", message: "Reset link sent to your email" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ status: "success", message: "Password reset successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/extrawork", authenticateToken, async (req, res) => {
  try {
    const userWork = await WorkSession.find({ userId: req.user.id });
    res.json(userWork);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

app.post("/api/extrawork", authenticateToken, async (req, res) => {
  try {
    const newSession = new WorkSession({
      ...req.body,
      userId: req.user.id
    });
    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (error) {
    res.status(400).json({ message: "Failed to save work session" });
  }
});

app.patch("/api/extrawork/:id", authenticateToken, async (req, res) => {
  try {
    const updatedSession = await WorkSession.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ message: "Record not found or unauthorized" });
    }

    res.json(updatedSession);
  } catch (error) {
    res.status(400).json({ message: "Failed to update record" });
  }
});

app.delete("/api/extrawork/:id", authenticateToken, async (req, res) => {
  try {
    const deletedSession = await WorkSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deletedSession) {
      return res.status(404).json({ message: "Record not found or unauthorized" });
    }

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete record" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
