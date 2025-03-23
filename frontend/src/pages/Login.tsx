import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LocationState {
  message?: string;
  email?: string;
}

const Login: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const { isDark } = useTheme();

  const [email, setEmail] = useState(state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(state?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Clear location state after using it
  useEffect(() => {
    if (state) {
      // Clear the location state to prevent showing the message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-avatar">
            <i className="fas fa-user"></i>
          </div>
          <h2 className="mt-4 mb-2 fw-bold">Welcome Back</h2>
          <p className="text-muted">Sign in to continue to QuizGenerator</p>
        </div>
        
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              <i className="fas fa-envelope me-2 text-primary"></i>
              Email Address
            </label>
            <input
              type="email"
              className="form-control auth-input"
              id="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label htmlFor="password" className="form-label mb-0">
                <i className="fas fa-lock me-2 text-primary"></i>
                Password
              </label>
              <Link to="#" className="text-decoration-none small text-primary" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="form-control auth-input"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          
          <div className="mb-4 form-check">
            <input 
              type="checkbox" 
              className="form-check-input" 
              id="rememberMe" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Remember me
            </label>
          </div>
          
          <button
            type="submit"
            className="btn auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing in...
              </span>
            ) : (
              <>
                <i className="fas fa-sign-in-alt me-2"></i>
                Sign In
              </>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p className="mb-0">
            Don't have an account?{' '}
            <Link to="/signup" className="fw-medium text-primary">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 