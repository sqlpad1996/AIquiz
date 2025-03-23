const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyToken = require('../middleware/authMiddleware');
const { createQuizFromPDF, getQuizById, submitQuizAnswers, retryQuiz } = require('../controllers/quizController');
const Quiz = require('../models/Quiz');

// Set up file upload with increased size limit
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Create quiz route
router.post('/create', verifyToken, upload.single('pdf'), createQuizFromPDF);

// Delete quiz route
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const result = await Quiz.deleteOne({ _id: req.params.id, userId: req.userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Quiz not found or you don't have permission to delete it" });
        }
        res.status(200).json({ message: "Quiz deleted successfully" });
    } catch (error) {
        console.error("Error deleting quiz:", error);
        res.status(500).json({ message: "Error deleting quiz" });
    }
});

// Retry quiz route - use controller function
router.post('/retry/:id', verifyToken, retryQuiz);

// Get quiz by ID route
router.get('/:id', verifyToken, (req, res) => {
    console.log("✅ Reached GET /api/quiz/:id route");
    getQuizById(req, res);
});

// Submit quiz answers route
router.post('/submit/:id', verifyToken, submitQuizAnswers);

module.exports = router;
