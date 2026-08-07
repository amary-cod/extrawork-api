const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb+srv://Admin:fatmah12@cluster0.edsncdq.mongodb.net/extrawork_db?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Successfully connected to the database"))
    .catch((err) => console.error("Database connection error:", err));

// Schema تسجيل الدخول
const userLoginSchema = new mongoose.Schema({
    userName: String,
    userLocation: String,
    loginTime: { type: Date, default: Date.now }
});
const UserLogin = mongoose.model('UserLogin', userLoginSchema);

// Schema الساعات الإضافية
const extraWorkSchema = new mongoose.Schema({
    id: String,
    date: String,
    name: String,
    service: String,
    location: String,
    startHeur: String,
    startMin: String,
    heur: Number,
    min: Number,
    currentHeur: String,
    currentMin: String
});
const ExtraWork = mongoose.model('ExtraWork', extraWorkSchema);

// الصفحة الرئيسية للتأكد من عمل السيرفر
app.get('/', (req, res) => {
    res.send("API Server is running successfully!");
});

// مسار تسجبل الدخول
app.post('/api/user/login', async (req, res) => {
    try {
        const { userName, userLocation } = req.body;
        const newLogin = new UserLogin({ userName, userLocation });
        await newLogin.save();
        res.status(201).json({ message: "Login successful", data: newLogin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// جلب كل الأنشطة
app.get('/api/extrawork', async (req, res) => {
    try {
        const data = await ExtraWork.find();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// إضافة نشاط جديد
app.post('/api/extrawork', async (req, res) => {
    try {
        const newWork = new ExtraWork(req.body);
        await newWork.save();
        res.status(201).json(newWork);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// تعديل نشاط
app.patch('/api/extrawork/:id', async (req, res) => {
    try {
        const updatedWork = await ExtraWork.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updatedWork);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// حذف نشاط
app.delete('/api/extrawork/:id', async (req, res) => {
    try {
        await ExtraWork.findOneAndDelete({ id: req.params.id });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// تحديد المنفذ حسب البيئة
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
