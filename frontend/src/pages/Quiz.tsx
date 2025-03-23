import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../api/quizService';
import '../styles/quiz.css'; // Import quiz-specific styles

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: string | number;
}

interface QuizData {
  _id: string;
  title?: string;
  generatedQuiz?: string;
  questions?: Question[];
  createdAt: string;
  score?: number;
  totalQuestions?: number;
  userId?: string;
  difficulty?: string;
  numQuestions?: number;
  userAnswers?: { questionId: string; selectedOption: string | number }[];
}

// Update the question extraction function to handle more formats
const extractQuestionsFromMarkdown = (markdown: string): Question[] => {
  console.log('Attempting to parse quiz text...');
  
  // Handle common formatting issues
  const sanitizedMarkdown = markdown
    // Standardize question format for easier parsing
    .replace(/\*\*Question\s*(\d+)[:.]?\*\*/gi, '**Question $1:**')
    // Standardize option formats - both (a) and a) should be recognized
    .replace(/\(([a-d])\)/gi, '$1)')
    // Standardize answer format
    .replace(/\*\*Correct Answer:\s*\(?([a-d])\)?\*\*/gi, '**Answer:** $1')
    .replace(/\*\*Answer:\s*\(?([a-d])\)?\*\*/gi, '**Answer:** $1');
  
  const questions: Question[] = [];
  
  // More flexible pattern to match questions
  const questionPattern = /\*\*Question\s+(\d+)[:\s]*\*\*\s*([\s\S]*?)(?=\*\*Question|$)/gi;
  let questionMatch;
  
  while ((questionMatch = questionPattern.exec(sanitizedMarkdown)) !== null) {
    try {
      const questionNumber = questionMatch[1];
      const questionContent = questionMatch[2].trim();
      
      // Extract the question text - everything until the first option
      const questionTextMatch = questionContent.match(/^([\s\S]*?)(?=[a-d]\))/i);
      if (!questionTextMatch) {
        console.warn(`Could not extract question text for Question ${questionNumber}`);
        continue;
      }
      
      const questionText = questionTextMatch[1].trim();
      
      // Extract options
      const options: string[] = [];
      const optionPattern = /([a-d]\))\s*([\s\S]*?)(?=[a-d]\)|$|\*\*Answer)/gi;
      let optionMatch;
      
      let optionsContent = questionContent.substring(questionTextMatch[0].length);
      
      // First capture all option matches
      const allOptionMatches = [];
      while ((optionMatch = optionPattern.exec(optionsContent)) !== null) {
        const optionLetter = optionMatch[1].charAt(0).toLowerCase();
        let optionText = optionMatch[2].trim();
        
        // Clean the option text to remove any answer indicators
        optionText = optionText
          // Remove any "**Answer:** X" or "Answer: X" text
          .replace(/\s*\*\*Answer:\*\*\s*[a-d].*?$/i, '')
          .replace(/\s*Answer:\s*[a-d].*?$/i, '')
          // Remove any "correct" or "answer" indicators
          .replace(/\s*\(correct\).*?$/i, '')
          .replace(/\s*correct answer.*?$/i, '')
          .replace(/\s*\*\*correct\*\*.*?$/i, '')
          .replace(/\s*\(answer\).*?$/i, '');
        
        allOptionMatches.push({
          letter: optionLetter,
          text: optionText
        });
      }
      
      // Sort options by letter to ensure correct order (a, b, c, d)
      allOptionMatches.sort((a, b) => a.letter.localeCompare(b.letter));
      
      // Extract the text only
      options.push(...allOptionMatches.map(opt => opt.text));
      
      // Different ways to extract the answer - try multiple patterns
      let correctAnswer = '';
      
      // Try multiple answer formats
      const answerPatterns = [
        /\*\*Answer:\*\*\s*([a-d])/i,
        /\*\*Correct Answer:\*\*\s*\(?([a-d])\)?/i,
        /Answer:\s*\(?([a-d])\)?/i
      ];
      
      for (const pattern of answerPatterns) {
        const answerMatch = questionContent.match(pattern);
        if (answerMatch) {
          correctAnswer = answerMatch[1].toUpperCase();
          break;
        }
      }
      
      // Skip if we don't have options or an answer
      if (options.length === 0) {
        console.warn(`No options found for Question ${questionNumber}, content: ${questionContent.substring(0, 100)}...`);
        continue;
      }
      
      if (!correctAnswer) {
        console.warn(`No answer found for Question ${questionNumber}, content: ${questionContent.substring(0, 100)}...`);
        continue;
      }
      
      // Generate a stable question ID
      const questionId = `q${questionNumber}`;
      
      questions.push({
        id: questionId,
        question: questionText,
        options,
        correctAnswer
      });
    } catch (err) {
      console.error(`Error parsing Question ${questionMatch[1]}:`, err);
    }
  }
  
  return questions;
};

const Quiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
  } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const quizData = await quizService.getQuiz(quizId);
        setQuiz(quizData);
        
        // Parse questions from generatedQuiz if available
        if (quizData.generatedQuiz) {
          // Log the first part of the quiz text to help with debugging
          console.log("Quiz text sample:", quizData.generatedQuiz.substring(0, 300) + "...");
          
          const parsedQuestions = extractQuestionsFromMarkdown(quizData.generatedQuiz);
          setQuestions(parsedQuestions);
          console.log('Parsed', parsedQuestions.length, 'questions from quiz');
          
          if (parsedQuestions.length === 0) {
            setError("Could not parse quiz questions. Please contact support.");
          }
        } else {
          console.warn("No generatedQuiz found in quiz data");
          setError("This quiz does not contain any questions.");
        }
        
        // Initialize submitted state if score exists
        if (quizData.score !== undefined && quizData.score !== null) {
          setSubmitted(true);
          
          // Load previous answers if available
          if (quizData.userAnswers && Array.isArray(quizData.userAnswers)) {
            const savedAnswers = quizData.userAnswers.reduce((acc: Record<string, string | number>, ans: {questionId: string; selectedOption: string | number}) => {
              if (ans.questionId && ans.selectedOption) {
                acc[ans.questionId] = ans.selectedOption;
              }
              return acc;
            }, {});
            
            setAnswers(savedAnswers);
            console.log('Loaded previous answers:', savedAnswers);
          } else {
            console.log('No previous answers found in quiz data');
          }
        }
      } catch (err: any) {
        console.error('Error loading quiz:', err);
        setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    // Add CSS styles for quiz options
    const style = document.createElement('style');
    style.textContent = `
      .option {
        background-color: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .option:hover {
        background-color: #f8f9fa;
        transform: translateY(-2px);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
      }
      .option-selected {
        background-color: rgba(13, 110, 253, 0.1) !important;
        border-left: 4px solid #0d6efd !important;
      }
      .option-correct {
        background-color: rgba(25, 135, 84, 0.1) !important;
        border-left: 4px solid #198754 !important;
      }
      .option-incorrect {
        background-color: rgba(220, 53, 69, 0.1) !important;
        border-left: 4px solid #dc3545 !important;
      }
      .letter-selected {
        background-color: #0d6efd !important;
        color: white;
      }
      .letter-correct {
        background-color: #198754 !important;
        color: white;
      }
      .letter-incorrect {
        background-color: #dc3545 !important;
        color: white;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => {
      // If the same option is clicked again, unselect it
      if (prev[questionId] === value) {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      }
      // Otherwise select the new option
      return {
        ...prev,
        [questionId]: value,
      };
    });
    
    // Show a toast/notification about remaining questions
    if (currentQuestionIndex === questions.length - 1) {
      // If on last question, auto-scroll to submit button
      setTimeout(() => {
        const submitButton = document.querySelector('.submit-quiz-button');
        if (submitButton) {
          submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    } else {
      // Go to next unanswered question if available
      const nextUnansweredIndex = findNextUnansweredQuestion();
      if (nextUnansweredIndex !== -1 && nextUnansweredIndex !== currentQuestionIndex) {
        setTimeout(() => {
          setCurrentQuestionIndex(nextUnansweredIndex);
        }, 600);
      }
    }
  };

  // Find the next unanswered question
  const findNextUnansweredQuestion = () => {
    // First look for unanswered questions after current index
    for (let i = currentQuestionIndex + 1; i < questions.length; i++) {
      if (!answers[questions[i].id]) {
        return i;
      }
    }
    
    // Then look for any unanswered questions from the beginning
    for (let i = 0; i < currentQuestionIndex; i++) {
      if (!answers[questions[i].id]) {
        return i;
      }
    }
    
    return -1; // All questions answered
  };

  // Get unanswered questions
  const unansweredQuestions = questions.filter(q => !answers[q.id]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quizId || !quiz) return;
    
    // Check if there are unanswered questions and prompt the user
    const unansweredQuestions = questions.filter((q) => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      // Show a confirmation dialog to confirm submission with unanswered questions
      const confirmSubmit = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s). Are you sure you want to submit the quiz anyway? Empty answers will be marked as incorrect (0 marks).`
      );
      
      if (!confirmSubmit) {
        return;
      }
      
      // Clear any existing error message since we're proceeding with submission
      setError('');
    }
    
    setSubmitting(true);
    
    try {
      // Format answers for all questions, including empty ones
      const formattedAnswers = questions.map(question => {
        // Use the selected answer if available, otherwise send empty string to mark as incorrect
        return {
          questionId: question.id,
          selectedOption: answers[question.id] || '' // Empty string for unanswered questions
        };
      });
      
      console.log('Submitting answers:', formattedAnswers);
      
      const result = await quizService.submitQuiz(quizId, { answers: formattedAnswers });
      setResults(result);
      setSubmitted(true);
      
      // Update quiz with score if available
      if (result.score !== undefined) {
        setQuiz({ ...quiz, score: result.score });
      }
      
      // Show the results for 3 seconds then navigate back to dashboard
      setTimeout(() => {
        navigate('/dashboard', { state: { refreshData: true }});
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      setError(err.response?.data?.message || 'Failed to submit quiz answers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!quizId) return;
    
    setLoading(true);
    
    try {
      await quizService.retryQuiz(quizId);
      setAnswers({});
      setSubmitted(false);
      setResults(null);
      setCurrentQuestionIndex(0);
      
      // Reload the quiz data
      const quizData = await quizService.getQuiz(quizId);
      setQuiz(quizData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retry quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quizId || !window.confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await quizService.deleteQuiz(quizId);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  // Calculate progress
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = questions.length > 0 
    ? Math.round((answeredCount / questions.length) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Quiz not found or you don't have access to it.</div>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card border-0 shadow-sm quiz-card">
        <div className="card-header quiz-header d-flex justify-content-between align-items-center">
          <h3>{quiz?.title}</h3>
          <div className="d-flex align-items-center">
            {submitted && quiz?.score !== undefined && (
              <span className="badge bg-white text-primary me-3 fs-6 px-3 py-2 shadow-sm">
                Score: {quiz.score}%
              </span>
            )}
            <button
              className="btn btn-outline-light btn-sm"
              onClick={handleDelete}
            >
              <i className="fas fa-trash me-2"></i>
              Delete Quiz
            </button>
          </div>
        </div>

        <div className="card-body p-4">
          {error && <div className="alert alert-danger">{error}</div>}
          
          {questions.length === 0 ? (
            <div className="alert alert-danger mb-4">
              <h5 className="alert-heading mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Could not parse quiz questions
              </h5>
              <p>We're having trouble processing this quiz. Our team has been notified of this issue.</p>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleDelete}
                >
                  <i className="fas fa-trash me-1"></i> Delete Quiz
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/create-quiz')}
                >
                  <i className="fas fa-plus me-1"></i> Create New Quiz
                </button>
              </div>
              
              {quiz?.generatedQuiz && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-2">Raw quiz text (for debugging):</h6>
                    <button 
                      className="btn btn-sm btn-link p-0" 
                      onClick={() => navigator.clipboard.writeText(quiz.generatedQuiz || '')}
                    >
                      <i className="fas fa-clipboard me-1"></i> Copy Text
                    </button>
                  </div>
                  <div className="border rounded bg-light p-3">
                    <pre style={{ maxHeight: '300px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                      {quiz.generatedQuiz}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Progress bar and indicator */}
              <div className="quiz-progress-container">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span className={answeredCount === questions.length ? "text-success fw-medium" : "text-muted"}>
                    <i className={`fas ${answeredCount === questions.length ? "fa-check-circle" : "fa-circle"} me-1`}></i>
                    {answeredCount} of {questions.length} answered
                    {unansweredQuestions.length > 0 && !submitted && (
                      <span className="ms-2 text-danger">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {unansweredQuestions.length} remaining
                      </span>
                    )}
                  </span>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${progressPercentage}%` }} 
                    aria-valuenow={progressPercentage} 
                    aria-valuemin={0} 
                    aria-valuemax={100}
                  ></div>
                </div>

                {/* Status message showing unanswered questions */}
                {!submitted && unansweredQuestions.length > 0 && (
                  <div className="mt-2 unanswered-indicator">
                    <small>
                      <span className="text-danger">
                        <i className="fas fa-circle me-1"></i>
                      </span>
                      Questions left: {unansweredQuestions.map((q, i) => {
                        const qIndex = questions.findIndex(question => question.id === q.id) + 1;
                        return (
                          <span key={q.id} className="badge rounded-pill bg-light text-dark border me-1 unanswered-badge"
                            onClick={() => navigateToQuestion(qIndex - 1)}>
                            {qIndex}
                          </span>
                        );
                      })}
                    </small>
                  </div>
                )}

                {/* Success message when all questions are answered */}
                {!submitted && answeredCount === questions.length && answeredCount > 0 && (
                  <div className="mt-2 text-success">
                    <small>
                      <i className="fas fa-check-circle me-1"></i>
                      All questions answered! You can now submit your quiz.
                    </small>
                  </div>
                )}
              </div>

              {/* Question navigation buttons (small screens) */}
              <div className="d-md-none mb-3">
                <div className="d-flex justify-content-between">
                  <button 
                    type="button" 
                    className="quiz-nav-btn" 
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <i className="fas fa-chevron-left me-1"></i> Previous
                  </button>
                  <button 
                    type="button" 
                    className="quiz-nav-btn" 
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next <i className="fas fa-chevron-right ms-1"></i>
                  </button>
                </div>
              </div>

              {/* Question selector (dots) */}
              <div className="question-dots">
                {questions.map((question, index) => {
                  // Determine status of this question
                  const isActive = currentQuestionIndex === index;
                  const isAnswered = answers[question.id] !== undefined;
                  
                  let statusClass = isActive ? 'btn-primary' : 'btn-outline-secondary';
                  if (!isActive && isAnswered) {
                    statusClass = 'btn-outline-success';
                  }
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`question-dot btn ${statusClass}`}
                      onClick={() => navigateToQuestion(index)}
                      aria-label={`Go to question ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current question */}
              {questions.length > 0 && (
                <div className="current-question p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0 fw-bold">
                      {questions[currentQuestionIndex].question}
                    </h4>
                    {!submitted && answers[questions[currentQuestionIndex].id] !== undefined && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setAnswers(prev => {
                            const newAnswers = { ...prev };
                            delete newAnswers[questions[currentQuestionIndex].id];
                            return newAnswers;
                          });
                        }}
                        title="Clear selection"
                      >
                        <i className="fas fa-times"></i> Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="options">
                    {questions[currentQuestionIndex].options.map((option, optionIndex) => {
                      const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
                      const isSelected = answers[questions[currentQuestionIndex].id] === optionLetter;
                      const correctAnswer = questions[currentQuestionIndex].correctAnswer;
                      const isCorrect = submitted && correctAnswer === optionLetter;
                      const isIncorrect = submitted && isSelected && correctAnswer !== optionLetter;
                      
                      let optionClass = "option";
                      let letterClass = "option-letter";
                      
                      if (isSelected) {
                        optionClass += submitted ? "" : " option-selected";
                      }
                      
                      if (isCorrect) {
                        optionClass += " option-correct";
                        letterClass += " letter-correct";
                      } else if (isIncorrect) {
                        optionClass += " option-incorrect";
                        letterClass += " letter-incorrect";
                      } else if (isSelected) {
                        letterClass += " letter-selected";
                      }
                      
                      return (
                        <div 
                          className={optionClass}
                          key={optionIndex}
                          onClick={() => {
                            if (!submitted) {
                              handleAnswerChange(
                                questions[currentQuestionIndex].id, 
                                optionLetter
                              );
                            }
                          }}
                        >
                          <div className={letterClass}>
                            {optionLetter}
                          </div>
                          <div className="option-text">{option}</div>
                          
                          {isCorrect && (
                            <div className="ms-auto text-success">
                              <i className="fas fa-check-circle fa-lg"></i>
                            </div>
                          )}
                          
                          {isIncorrect && (
                            <div className="ms-auto text-danger">
                              <i className="fas fa-times-circle fa-lg"></i>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {submitted && (
                    <div className="feedback mt-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          {answers[questions[currentQuestionIndex].id] === questions[currentQuestionIndex].correctAnswer ? (
                            <i className="fas fa-check-circle text-success fa-lg"></i>
                          ) : (
                            <i className="fas fa-times-circle text-danger fa-lg"></i>
                          )}
                        </div>
                        <div>
                          {answers[questions[currentQuestionIndex].id] === questions[currentQuestionIndex].correctAnswer ? (
                            <p className="mb-0 text-success fw-medium">Correct!</p>
                          ) : (
                            <div>
                              <p className="mb-0 text-danger fw-medium">Incorrect</p>
                              <p className="mb-0 small">
                                The correct answer is {questions[currentQuestionIndex].correctAnswer}.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Question navigation (desktop) */}
              <div className="quiz-nav-buttons">
                <button
                  type="button"
                  className="quiz-nav-btn"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <i className="fas fa-chevron-left me-2"></i> Previous
                </button>

                <div>
                  {submitted ? (
                    <button
                      type="button"
                      className="submit-quiz-button"
                      onClick={handleRetry}
                    >
                      <i className="fas fa-redo me-2"></i> Retry Quiz
                    </button>
                  ) : (
                    <>
                      {/* Marking scheme info box */}
                      {answeredCount < questions.length && (
                        <div className="text-center mb-3">
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i> 
                            <strong>Marking Scheme</strong>: 
                            <span className="ms-1 text-success">Correct: full marks</span> | 
                            <span className="ms-1 text-danger">Incorrect/Empty: 0 marks</span>
                          </small>
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        className="submit-quiz-button"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className={`fas ${answeredCount < questions.length ? 'fa-exclamation-triangle' : 'fa-check'} me-2`}></i> 
                            Submit Quiz 
                            {answeredCount < questions.length && (
                              <span className="ms-1">({questions.length - answeredCount} unanswered)</span>
                            )}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className="quiz-nav-btn"
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next <i className="fas fa-chevron-right ms-2"></i>
                </button>
              </div>

              {/* Results display */}
              {submitted && results && (
                <div className="quiz-results">
                  <h4 className="mb-3 fw-bold text-center">Quiz Results</h4>
                  <div className="display-4 fw-bold mb-3 text-center">{results.score}%</div>
                  <p className="mb-0 text-center">You got {results.correctAnswers} out of {results.totalQuestions} questions correct.</p>
                  
                  <div className="d-flex justify-content-center mt-4">
                    <div className="text-start">
                      <p className="text-muted small mb-2">Marking scheme:</p>
                      <div className="d-flex align-items-center mb-1">
                        <span className="badge bg-success me-2">✓</span>
                        <span className="small">Correct answer: Full marks</span>
                      </div>
                      <div className="d-flex align-items-center mb-1">
                        <span className="badge bg-danger me-2">✗</span>
                        <span className="small">Incorrect answer: 0 marks</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="badge bg-secondary me-2">-</span>
                        <span className="small">Unanswered: 0 marks</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      className="submit-quiz-button"
                      onClick={() => navigate('/dashboard')}
                    >
                      <i className="fas fa-home me-2"></i> Return to Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Back to dashboard */}
              {!submitted && !results && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => navigate('/dashboard')}
                  >
                    <i className="fas fa-arrow-left me-2"></i> Back to Dashboard
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz; 