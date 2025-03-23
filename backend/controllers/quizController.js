const pdfParse = require('pdf-parse');
const axios = require('axios');
const Quiz = require('../models/Quiz');

// Helper function to verify and sanitize quiz text
const verifyAndSanitizeQuizText = (quizText) => {
    if (!quizText) return null;
    
    console.log("Sanitizing quiz text...");
    
    // Check if quiz has the expected structure
    const hasQuestions = quizText.includes('**Question');
    const hasOptions = /[a-d]\)/.test(quizText) || /\([a-d]\)/.test(quizText);
    const hasAnswers = quizText.includes('**Answer:**') || quizText.includes('**Correct Answer:**') || quizText.includes('Answer:');
    
    if (!hasQuestions || !hasOptions || !hasAnswers) {
        console.error('Quiz text does not have the expected structure:', {
            hasQuestions,
            hasOptions, 
            hasAnswers
        });
        return null;
    }

    try {
        // First, standardize formatting
        let sanitizedText = quizText
            // Standardize question headers
            .replace(/\*\*Question\s*(\d+)[:.]\*\*/gi, '**Question $1:**')
            
            // Standardize option format - convert (a) to a) if needed
            .replace(/\(([a-d])\)/gi, '$1)')
            
            // Replace any answer format variations with the standardized format
            .replace(/\*\*Correct Answer:\*\*\s*\(?([a-d])\)?/gi, '**Answer:** $1')
            .replace(/Answer:\s*([a-d])/gi, '**Answer:** $1')
            .replace(/\*\*Answer:\*\*\s*\(([a-d])\)/gi, '**Answer:** $1')
            
            // Remove explanations (anything after the answer)
            .replace(/(\*\*Answer:\*\*\s*[a-d])[^*\n]*(\n|$)/gi, '$1$2')
            
            // Ensure there's a line break after each answer
            .replace(/(\*\*Answer:\*\*\s*[a-d])(\s*\*\*Question)/gi, '$1\n\n$2');
        
        // Split quiz into individual question blocks
        const questionBlocks = sanitizedText.split(/\*\*Question\s+\d+:\*\*/g).slice(1);
        let fixedBlocks = [];
        
        for (let i = 0; i < questionBlocks.length; i++) {
            let block = questionBlocks[i];
            
            // Extract answer for this question
            const answerMatch = block.match(/\*\*Answer:\*\*\s*([a-d])/i);
            if (!answerMatch) {
                fixedBlocks.push(block);
                continue;
            }
            
            // Extract question and options
            let questionSection = block.split(/a\)/i)[0]; // Text before first option
            
            // Extract all options as individual items
            const optionPattern = /([a-d]\))([\s\S]*?)(?=[a-d]\)|$|\*\*Answer)/gi;
            let optionMatches = [];
            let match;
            
            // Create a copy of the block to find all option matches
            let tempBlock = block;
            while ((match = optionPattern.exec(tempBlock)) !== null) {
                const optionLetter = match[1].charAt(0).toLowerCase();
                const optionText = match[2].trim();
                
                // Check for any answer indicators in this option
                const cleanedOptionText = optionText
                    // Remove any "Answer: X" text
                    .replace(/\s*\*\*Answer:\*\*\s*[a-d].*?$/i, '')
                    .replace(/\s*Answer:\s*[a-d].*?$/i, '')
                    // Remove any "(correct)" or "correct answer" indicators
                    .replace(/\s*\(correct\).*?$/i, '')
                    .replace(/\s*correct answer.*?$/i, '')
                    .replace(/\s*\*\*Answer\*\*.*?$/i, '')
                    .replace(/\s*\(answer\).*?$/i, '');
                
                optionMatches.push({
                    letter: optionLetter,
                    text: cleanedOptionText
                });
            }
            
            // Rebuild the block with cleaned options
            let newBlock = questionSection;
            for (const option of optionMatches) {
                newBlock += `${option.letter}) ${option.text}\n`;
            }
            
            // Add the answer at the end
            newBlock += `**Answer:** ${answerMatch[1]}`;
            
            fixedBlocks.push(newBlock);
        }
        
        // Reassemble the quiz text with fixed blocks
        sanitizedText = fixedBlocks.map((block, i) => 
            `**Question ${i+1}:**${block}`
        ).join('\n\n');
        
        console.log("Sanitization complete");
        return sanitizedText;
    } catch (err) {
        console.error("Error sanitizing quiz text:", err);
        return quizText; // Return original if sanitization fails
    }
};

exports.getQuizById = async (req, res) => {
    console.log("User ID from token:", req.userId);
    console.log("Quiz ID from URL:", req.params.id);

    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });

    if (!quiz) {
        console.log("❌ Quiz not found or doesn't belong to user");
        return res.status(404).json({ message: "Quiz not found" });
    }

    // Return the quiz including any saved user answers
    res.status(200).json({ quiz });
};

exports.submitQuizAnswers = async (req, res) => {
    try {
        const { answers } = req.body;
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
        
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        const generatedText = quiz.generatedQuiz;
        let correct = 0;
        let totalQuestions = answers.length;

        // Log for debugging
        console.log(`Processing ${totalQuestions} answers for quiz ${req.params.id}`);
        
        // Process each answer
        answers.forEach((ans) => {
            if (!ans.selectedOption) {
                console.log(`Question ${ans.questionId}: Empty answer (incorrect)`);
                return; // Empty answer, counted as incorrect
            }
            
            // Look for the answer pattern in the generated text
            // Using case-insensitive regex to match answer format: **Answer:** X
            const regex = new RegExp(`\\*\\*Answer:\\*\\*\\s*${ans.selectedOption}\\b`, 'i');
            
            // Check if this answer corresponds to the question
            const questionMatch = new RegExp(`\\*\\*Question\\s+${ans.questionId.replace('q', '')}:\\*\\*[\\s\\S]*?\\*\\*Answer:\\*\\*\\s*([a-d])\\b`, 'i');
            const matchResult = generatedText.match(questionMatch);
            
            if (matchResult) {
                const correctAnswer = matchResult[1].toUpperCase();
                const isCorrect = ans.selectedOption.toUpperCase() === correctAnswer;
                
                if (isCorrect) {
                    correct += 1;
                    console.log(`Question ${ans.questionId}: Correct answer (${ans.selectedOption})`);
                } else {
                    console.log(`Question ${ans.questionId}: Incorrect answer (selected: ${ans.selectedOption}, correct: ${correctAnswer})`);
                }
            } else {
                // Fallback to simpler pattern matching if question-specific match fails
                if (regex.test(generatedText)) {
                    correct += 1;
                    console.log(`Question ${ans.questionId}: Correct answer using simple match (${ans.selectedOption})`);
                } else {
                    console.log(`Question ${ans.questionId}: Incorrect answer using simple match (${ans.selectedOption})`);
                }
            }
        });

        // Calculate final score as percentage
        const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
        
        console.log(`Quiz ${req.params.id} score: ${correct}/${totalQuestions} = ${score}%`);
        
        // Update quiz with score and save user's answers
        quiz.score = score;
        quiz.userAnswers = answers; // Store the user's answers
        await quiz.save();

        // Send response
        res.status(200).json({
            message: "Quiz submitted",
            correctAnswers: correct,
            totalQuestions,
            score
        });
    } catch (err) {
        console.error("Error submitting quiz answers:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.retryQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        // Reset the score to null and clear previous answers
        quiz.score = null;
        quiz.userAnswers = [];
        await quiz.save();

        return res.status(200).json({ 
            message: "Quiz reset for retry", 
            quiz 
        });
    } catch (err) {
        console.error("Error retrying quiz:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.createQuizFromPDF = async (req, res) => {
    try {
        const { quizTitle, difficulty, numQuestions } = req.body;

        // Check for file from Multer only
        if (!req.file) {
            console.log("No file found in request");
            return res.status(400).json({ message: "PDF file is required" });
        }

        console.log(`File received successfully: ${req.file.originalname}, size: ${req.file.size} bytes`);
        
        const pdfText = await pdfParse(req.file.buffer);
        const content = pdfText.text;

        const prompt = `
Generate ${numQuestions} high-quality multiple-choice questions based on the provided text. Make them ${difficulty} difficulty level.

IMPORTANT: Your response MUST strictly follow this format for EACH question:

**Question 1:** 
[The question text here - make sure it's clear, accurate, and relevant to the content]
a) [First option - should be plausible]
b) [Second option - should be plausible]
c) [Third option - should be plausible]
d) [Fourth option - should be plausible]
**Answer:** [letter]

**Question 2:**
[Next question]
...and so on

Critical requirements:
1. Questions must be factually accurate and directly based on the provided content.
2. Begin each question with "**Question X:**" with the asterisks.
3. Each option MUST start with a lowercase letter followed by a closing parenthesis: a), b), c), d)
4. Exactly ONE option must be correct. The others must be plausible but clearly incorrect.
5. Each option MUST be on its own line.
6. After the options, write "**Answer:** [letter]" with the asterisks, where [letter] is ONLY a, b, c, or d (just the single letter).
7. Make sure there is an empty line between each question.
8. Do NOT include explanations, "Correct Answer", or additional text.
9. Format must be exactly as shown above.
10. You MUST create exactly ${numQuestions} questions.
11. Do NOT use "(a)", "(b)" format - use "a)", "b)" format only.
12. Do NOT include "Explanation:" or any text after the answer.
13. Do NOT leak the correct answer in the question text or in option formatting.
14. AVOID questions with "All of the above" or "None of the above" as options.
15. Questions should assess important concepts, not minor details.

Here is the content to create questions from:
${content}
`;

        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
            {
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40
                }
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        let quizText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Verify and sanitize quiz text
        const sanitizedQuizText = verifyAndSanitizeQuizText(quizText);
        if (!sanitizedQuizText) {
            return res.status(500).json({ message: "Generated quiz has invalid format. Please try again." });
        }
        
        quizText = sanitizedQuizText;

        // Save to MongoDB
        const newQuiz = new Quiz({
            userId: req.userId,
            title: quizTitle,
            difficulty,
            numQuestions,
            generatedQuiz: quizText
        });

        await newQuiz.save();

        // ✅ Send response once
        return res.status(200).json({ message: "Quiz created", quiz: newQuiz });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error generating quiz", error: err.message });
    }
};

