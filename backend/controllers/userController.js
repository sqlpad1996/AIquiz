// backend/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Quiz = require('../models/Quiz');

exports.getDashboard = async (req, res) => {
    try {
        // Get all quizzes for this user
        const quizzes = await Quiz.find({ userId: req.userId }).sort({ createdAt: -1 });
        
        // Count quizzes with scores (completed quizzes)
        const completedQuizzes = quizzes.filter(q => q.score !== null && q.score !== undefined);
        const totalTaken = completedQuizzes.length;
        
        // Calculate average score from completed quizzes only
        let avgScore = 0;
        if (totalTaken > 0) {
            const totalScore = completedQuizzes.reduce((acc, q) => acc + q.score, 0);
            avgScore = Number((totalScore / totalTaken).toFixed(2));
        }
        
        console.log(`User ${req.userId} Dashboard stats: ${totalTaken} quizzes, avg score: ${avgScore}`);
        
        // Return dashboard data
        res.status(200).json({
            stats: {
                totalQuizzesTaken: totalTaken,
                averageScore: avgScore
            },
            history: quizzes
        });
    } catch (err) {
        console.error("Error getting dashboard data:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getProfile = async (req, res) => {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
};

exports.updateProfile = async (req, res) => {
    const { firstName, lastName, gender } = req.body;

    const user = await User.findByIdAndUpdate(req.userId, { firstName, lastName, gender }, { new: true }).select("-password");
    res.status(200).json({ message: "Profile updated", user });
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
};
