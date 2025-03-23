import apiClient from './client';

interface Dashboard {
  totalQuizzes: number;
  averageScore: number;
  quizHistory: Array<{
    quizId: string;
    title: string;
    score: number;
    totalQuestions: number;
    date: string;
  }>;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  gender?: string;
}

interface ProfileResponse {
  user: UserProfile;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  gender?: string;
  password?: string;
  newPassword?: string;
}

export const userService = {
  // Get dashboard data
  getDashboard: async (): Promise<{
    totalQuizzes: number;
    averageScore: number;
    quizzes: Array<{
      _id: string;
      title: string;
      score?: number;
      totalQuestions?: number;
      createdAt: string;
    }>;
  }> => {
    try {
      const response = await apiClient.get('/api/user/dashboard');
      // Handle both response formats (old and new)
      if (response.data.history) {
        // Old format
        return {
          totalQuizzes: response.data.stats?.totalQuizzesTaken || 0,
          averageScore: parseFloat(response.data.stats?.averageScore || 0),
          quizzes: response.data.history || []
        };
      } else {
        // New format
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ProfileResponse>('/api/user/profile');
    return response.data.user;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.put<ProfileResponse>('/api/user/profile', data);
    return response.data.user;
  }
};

export default userService; 