import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Signup: React.FC = () => {
  const { isDark } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate terms agreement
    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsSubmitting(true);

    try {
      // Pass all required fields to the signup function
      await signup(firstName, lastName, email, gender, password, confirmPassword);
      
      // Redirect to login page with success message instead of dashboard
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please sign in with your credentials.', 
          email: email 
        } 
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-avatar">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2 className="mt-4 mb-2 fw-bold">Create Account</h2>
          <p className="text-muted">Join QuizGenerator and start learning smarter</p>
        </div>
        
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="row">
            <div className="col-md-6 mb-4">
              <label htmlFor="firstName" className="form-label">
                <i className="fas fa-user me-2 text-primary"></i>
                First Name
              </label>
              <input
                type="text"
                className="form-control auth-input"
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            
            <div className="col-md-6 mb-4">
              <label htmlFor="lastName" className="form-label">
                <i className="fas fa-user me-2 text-primary"></i>
                Last Name
              </label>
              <input
                type="text"
                className="form-control auth-input"
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
          </div>
          
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
            <label htmlFor="gender" className="form-label">
              <i className="fas fa-venus-mars me-2 text-primary"></i>
              Gender
            </label>
            <select
              className="form-select auth-input"
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              autoComplete="off"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              <i className="fas fa-lock me-2 text-primary"></i>
              Password
            </label>
            <input
              type="password"
              className="form-control auth-input"
              id="password"
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <div className="form-text">
              <i className="fas fa-info-circle me-1"></i>
              Password must be at least 6 characters long
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="form-label">
              <i className="fas fa-lock me-2 text-primary"></i>
              Confirm Password
            </label>
            <input
              type="password"
              className="form-control auth-input"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          
          <div className="mb-4 form-check">
            <input 
              type="checkbox" 
              className="form-check-input" 
              id="termsCheck" 
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              required 
            />
            <label className="form-check-label" htmlFor="termsCheck">
              I agree to the <Link to="#" className="text-decoration-none">Terms of Service</Link> and <Link to="#" className="text-decoration-none">Privacy Policy</Link>
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
                Creating Account...
              </span>
            ) : (
              <>
                <i className="fas fa-user-plus me-2"></i>
                Create Account
              </>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p className="mb-0">
            Already have an account?{' '}
            <Link to="/login" className="fw-medium text-primary">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup; 