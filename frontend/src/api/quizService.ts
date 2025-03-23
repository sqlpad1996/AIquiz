import apiClient from './client';

interface AnswerItem {
  questionId: string;
  selectedOption: string | number;
}

interface QuizSubmission {
  answers: AnswerItem[];
}

interface Quiz {
  _id: string;
  title?: string;
  generatedQuiz?: string;
  questions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: string | number;
  }>;
  createdAt: string;
  score?: number;
  totalQuestions?: number;
  userId?: string;
  difficulty?: string;
  numQuestions?: number;
  userAnswers?: Array<{
    questionId: string;
    selectedOption: string | number;
  }>;
}

interface QuizResponse {
  quiz: Quiz;
  message?: string;
}

export const quizService = {
  // Create a new quiz by uploading a PDF
  createQuiz: async (formData: FormData): Promise<Quiz> => {
    const response = await apiClient.post<QuizResponse>('/api/quiz/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.quiz;
  },

  // Get a specific quiz by ID
  getQuiz: async (quizId: string): Promise<Quiz> => {
    try {
      const response = await apiClient.get<QuizResponse>(`/api/quiz/${quizId}`);
      return response.data.quiz;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  },

  // Submit answers for a quiz
  submitQuiz: async (quizId: string, submission: QuizSubmission): Promise<any> => {
    try {
      console.log('Submitting answers:', submission);
      const response = await apiClient.post(`/api/quiz/submit/${quizId}`, submission);
      console.log('Submit response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz answers:', error);
      throw error;
    }
  },

  // Retry a quiz
  retryQuiz: async (quizId: string): Promise<any> => {
    try {
      const response = await apiClient.post<QuizResponse>(`/api/quiz/retry/${quizId}`);
      return response.data.quiz;
    } catch (error) {
      console.error('Error retrying quiz:', error);
      throw error;
    }
  },

  // Delete a quiz
  deleteQuiz: async (quizId: string): Promise<void> => {
    await apiClient.delete(`/api/quiz/${quizId}`);
  }
};

export default quizService; 