const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: String,
    difficulty: String,
    numQuestions: Number,
    generatedQuiz: String,
    score: {
        type: Number,
        default: null // not taken yet
    },
    userAnswers: [{
        questionId: String,
        selectedOption: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Quiz', quizSchema);
