import React, { useEffect, useState } from 'react';
import { userService } from '../api/userService';
import { useLocation, useNavigate } from 'react-router-dom';
import { quizService } from '../api/quizService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LocationState {
  refreshData?: boolean;
}

// Update the Quiz interface to include both numQuestions and totalQuestions for flexibility
interface Quiz {
  _id: string;
  title: string;
  createdAt: string;
  difficulty: string;
  score: number | null;
  numQuestions?: number;
  totalQuestions?: number; // Some API responses might use this instead of numQuestions
  userId: string;
}

// Define an interface for the quiz data as returned from the API
interface ApiQuiz {
  _id: string;
  title: string;
  createdAt: string;
  score?: number;
  totalQuestions?: number;
  difficulty?: string;
  userId?: string;
}

function Dashboard() {
  const [totalQuizzes, setTotalQuizzes] = useState<number>(0);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState<{ [key: string]: boolean }>({});
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const [dataRefreshed, setDataRefreshed] = useState<boolean>(false);
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [recentActivity, setRecentActivity] = useState<Quiz[]>([]);
  const [showAllQuizzes, setShowAllQuizzes] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getDashboard();
      setTotalQuizzes(data.totalQuizzes || 0);
      setAverageScore(data.averageScore);
      
      // Sort quizzes by creation date (newest first)
      const sortedQuizzes = (data.quizzes || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Convert API quizzes to our Quiz interface format
      const formattedQuizzes: Quiz[] = sortedQuizzes.map((quiz: ApiQuiz) => ({
        _id: quiz._id,
        title: quiz.title,
        createdAt: quiz.createdAt,
        score: quiz.score !== undefined ? quiz.score : null,
        numQuestions: quiz.totalQuestions,
        difficulty: quiz.difficulty || 'Unknown',
        userId: quiz.userId || '',
      }));
      
      setQuizzes(formattedQuizzes);
      
      // Get recent activity (last 5 quizzes)
      setRecentActivity(formattedQuizzes.slice(0, 5));
      
      console.log('Dashboard data loaded:', { totalQuizzes: data.totalQuizzes, averageScore: data.averageScore });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data when coming back from quiz completion
  useEffect(() => {
    if (state?.refreshData && !dataRefreshed) {
      console.log('Refreshing dashboard data after quiz completion');
      fetchDashboardData();
      setDataRefreshed(true);
    }
  }, [state?.refreshData, dataRefreshed]);

  const handleViewQuiz = (quizId: string) => {
    navigate(`/quiz/${quizId}`);
  };

  const handleRetryQuiz = async (quizId: string) => {
    try {
      setRetryLoading(prev => ({ ...prev, [quizId]: true }));
      await quizService.retryQuiz(quizId);
      
      // Refresh dashboard data after successful retry
      await fetchDashboardData();
      
      // Navigate to the quiz
      navigate(`/quiz/${quizId}`);
    } catch (err) {
      console.error('Error retrying quiz:', err);
      setError('Failed to retry quiz. Please try again.');
    } finally {
      setRetryLoading(prev => ({ ...prev, [quizId]: false }));
    }
  };

  const handleCreateQuiz = () => {
    navigate('/create-quiz');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Format to show time elapsed (e.g., "2 days ago")
  const getTimeElapsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }
    if (diffInHours > 0) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }
    if (diffInMinutes > 0) {
      return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    }
    return 'Just now';
  };

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'hard': return 'bg-danger';
      default: return 'bg-info';
    }
  };

  const getScoreColorClass = (score: number | null) => {
    if (score === null) return 'text-muted';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  };
  
  const getScoreIcon = (score: number | null) => {
    if (score === null) return 'fas fa-question-circle';
    if (score >= 80) return 'fas fa-trophy';
    if (score >= 60) return 'fas fa-medal';
    return 'fas fa-exclamation-circle';
  };

  if (loading) {
    return (
      <div className="container mt-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="lead text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  // Quizzes to display - either all or just the recent ones
  const displayedQuizzes = showAllQuizzes ? quizzes : quizzes.slice(0, 6);

  return (
    <div className="dashboard-container py-4">
      <div className="container">
        <div className="row mb-4">
          <div className="col-12">
            <div className="dashboard-welcome d-sm-flex justify-content-between align-items-center">
              <div>
                <h1 className="fw-bold mb-0">Your Dashboard</h1>
                <p className="text-muted">Welcome back, {user?.firstName || 'User'}</p>
              </div>
              <button 
                className="btn btn-primary d-flex align-items-center mt-3 mt-sm-0" 
                onClick={handleCreateQuiz}
              >
                <i className="fas fa-plus-circle me-2"></i> Create New Quiz
              </button>
            </div>
            
            {error && (
              <div className="alert alert-danger alert-dismissible fade show mt-3" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i> {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="row mb-5 g-4">
          <div className="col-lg-4 col-md-6">
            <div className="card border-0 shadow-sm dashboard-stat-card h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title text-muted mb-0">Total Quizzes</h5>
                  <div className="stat-icon-sm bg-primary bg-opacity-10 rounded-circle">
                    <i className="fas fa-book-open text-primary"></i>
                  </div>
                </div>
                <div className="d-flex align-items-baseline">
                  <h2 className="display-4 fw-bold mb-0">{totalQuizzes}</h2>
                  <span className="ms-2 text-muted">quizzes</span>
                </div>
                <p className="text-muted mt-3 mb-0">
                  <i className="fas fa-info-circle me-1"></i> 
                  {totalQuizzes === 0 
                    ? 'Create your first quiz to get started'
                    : totalQuizzes === 1 
                      ? 'You have created 1 quiz so far'
                      : `You have created ${totalQuizzes} quizzes so far`
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4 col-md-6">
            <div className="card border-0 shadow-sm dashboard-stat-card h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title text-muted mb-0">Average Score</h5>
                  <div className="stat-icon-sm bg-success bg-opacity-10 rounded-circle">
                    <i className="fas fa-chart-line text-success"></i>
                  </div>
                </div>
                <div className="d-flex align-items-baseline">
                  <h2 className="display-4 fw-bold mb-0">
                    {averageScore !== null && !isNaN(averageScore) 
                      ? Math.round(averageScore) 
                      : 0}
                  </h2>
                  <span className="ms-2 text-muted">%</span>
                </div>
                <p className="text-muted mt-3 mb-0">
                  <i className="fas fa-info-circle me-1"></i> 
                  {!averageScore || isNaN(averageScore) 
                    ? 'Take a quiz to see your average score'
                    : averageScore >= 80 
                      ? 'Excellent! Keep up the good work'
                      : averageScore >= 60 
                        ? 'Good progress! Room for improvement'
                        : 'Keep practicing to improve your score'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4 col-md-12">
            <div className="card border-0 shadow-sm dashboard-stat-card h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title text-muted mb-0">Recent Activity</h5>
                  <div className="stat-icon-sm bg-info bg-opacity-10 rounded-circle">
                    <i className="fas fa-history text-info"></i>
                  </div>
                </div>
                
                {recentActivity.length > 0 ? (
                  <div className="recent-activity-list">
                    {recentActivity.slice(0, 3).map(quiz => (
                      <div key={quiz._id} className="recent-activity-item d-flex align-items-center" onClick={() => handleViewQuiz(quiz._id)}>
                        <div className={`activity-icon me-3 ${getScoreColorClass(quiz.score)}`}>
                          <i className={getScoreIcon(quiz.score)}></i>
                        </div>
                        <div className="flex-grow-1 text-truncate">
                          <p className="mb-0 fw-medium text-truncate">{quiz.title}</p>
                          <small className="text-muted">{getTimeElapsed(quiz.createdAt)}</small>
                        </div>
                        <span className={`badge ${getDifficultyBadgeClass(quiz.difficulty)}`}>
                          {quiz.difficulty || 'Unknown'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mt-3 mb-0">
                    <i className="fas fa-info-circle me-1"></i> 
                    No recent activity to display
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Quiz History Section */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card border-0 rounded-4 shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 rounded-top-4 border-0">
                <div className="d-flex align-items-center">
                  <i className="fas fa-history text-primary me-2"></i>
                  <h3 className="card-title mb-0 fw-bold">Quiz History</h3>
                </div>
                <div>
                  {showAllQuizzes && quizzes.length > 6 && (
                    <button 
                      className="btn btn-sm btn-outline-secondary me-2 quiz-action-btn" 
                      onClick={() => setShowAllQuizzes(false)}
                    >
                      <i className="fas fa-compress-alt me-1"></i> Show Less
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-primary quiz-action-btn" 
                    onClick={fetchDashboardData} 
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt me-2"></i>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
              
              {quizzes.length > 0 ? (
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 quiz-history-table">
                      <thead className={`${isDark ? 'table-dark' : 'table-light'}`}>
                        <tr>
                          <th className="ps-4">Title</th>
                          <th>Created</th>
                          <th>Difficulty</th>
                          <th>Questions</th>
                          <th>Score</th>
                          <th className="text-end pe-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedQuizzes.map((quiz) => (
                          <tr key={quiz._id} className="quiz-table-row">
                            <td className="ps-4 fw-medium">{quiz.title}</td>
                            <td className="text-muted">{formatDate(quiz.createdAt)}</td>
                            <td>
                              <span className={`badge ${getDifficultyBadgeClass(quiz.difficulty)}`}>
                                {quiz.difficulty || 'Unknown'}
                              </span>
                            </td>
                            <td>{quiz.numQuestions || quiz.totalQuestions || '-'}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className={`${getScoreIcon(quiz.score)} me-2 ${getScoreColorClass(quiz.score)}`}></i>
                                <span className={`fw-bold ${getScoreColorClass(quiz.score)}`}>
                                  {quiz.score !== null ? `${quiz.score}%` : 'Not taken'}
                                </span>
                              </div>
                            </td>
                            <td className="text-end pe-4">
                              <button
                                className="btn btn-sm btn-primary me-2 quiz-action-btn"
                                onClick={() => handleViewQuiz(quiz._id)}
                              >
                                <i className={`fas ${quiz.score !== null ? 'fa-eye' : 'fa-play'} me-1`}></i>
                                {quiz.score !== null ? 'View Results' : 'Take Quiz'}
                              </button>
                              {quiz.score !== null && (
                                <button
                                  className="btn btn-sm btn-outline-secondary quiz-action-btn"
                                  onClick={() => handleRetryQuiz(quiz._id)}
                                  disabled={retryLoading[quiz._id]}
                                >
                                  {retryLoading[quiz._id] ? (
                                    <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Retrying</>
                                  ) : (
                                    <><i className="fas fa-redo me-1"></i> Retry</>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {!showAllQuizzes && quizzes.length > 6 && (
                    <div className="text-center py-3">
                      <button 
                        className="btn btn-outline-primary view-all-btn"
                        onClick={() => setShowAllQuizzes(true)}
                      >
                        <i className="fas fa-chevron-down me-1"></i> View All {quizzes.length} Quizzes
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-body text-center py-5 empty-state-container">
                  <div className="empty-state-icon mb-4">
                    <div className="bg-light rounded-circle p-4 d-inline-block shadow-sm">
                      <i className="fas fa-folder-open text-muted fa-3x"></i>
                    </div>
                  </div>
                  <h4 className="mb-3">No quizzes yet</h4>
                  <p className="text-muted mb-4">Create your first quiz to start learning and testing your knowledge</p>
                  <button 
                    className="btn btn-primary create-quiz-btn" 
                    onClick={handleCreateQuiz}
                  >
                    <i className="fas fa-plus-circle me-2"></i> Create Your First Quiz
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tips and Recommendations */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 rounded-4 shadow-sm tips-section">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                    <i className="fas fa-lightbulb text-warning"></i>
                  </div>
                  <h4 className="mb-0 fw-bold">Tips for Effective Learning</h4>
                </div>
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="tip-item d-flex">
                      <div className="tip-icon me-3 bg-primary bg-opacity-10">
                        <i className="fas fa-file-pdf text-primary"></i>
                      </div>
                      <div>
                        <h5 className="fs-6 fw-bold">Choose Good Materials</h5>
                        <p className="small text-muted mb-0">Upload clear, well-structured PDF documents for best quiz generation results.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="tip-item d-flex">
                      <div className="tip-icon me-3 bg-success bg-opacity-10">
                        <i className="fas fa-redo text-success"></i>
                      </div>
                      <div>
                        <h5 className="fs-6 fw-bold">Practice Regularly</h5>
                        <p className="small text-muted mb-0">Retry quizzes multiple times to improve memory retention and understanding.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="tip-item d-flex">
                      <div className="tip-icon me-3 bg-danger bg-opacity-10">
                        <i className="fas fa-clock text-danger"></i>
                      </div>
                      <div>
                        <h5 className="fs-6 fw-bold">Space Your Learning</h5>
                        <p className="small text-muted mb-0">Review material at increasing intervals for better long-term recall.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 