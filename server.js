require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

// Connection to Database
mongoose.connect(MONGO_URI)
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.error("Database connection error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", UserSchema);

// Extra Work Session Schema
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

// Middleware to Authenticate JWT
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

// 1. Auth Routes
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newUser = new User({ name, email, password });
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
    const user = await User.findOne({ email, password });
    console.log("User found:", user ? "yes" : "no");

    if (!user) {
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

// 2. Extra Work CRUD Routes
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

// Server Listener
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
