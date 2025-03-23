import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Home: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Learn Smarter with AI-Generated Quizzes</h1>
          <p className="hero-subtitle">
            Transform your study materials into interactive quizzes in seconds.
            Master any subject with personalized learning.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-light btn-lg animate-button me-3">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg animate-button">
              Sign In
            </Link>
          </div>
        </div>
        <div className="blob-animation"></div>
      </section>

      {/* How It Works Section */}
      <section className="feature-section">
        <div className="container text-center">
          <h2 className="display-5 fw-bold mb-4">How It Works</h2>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <p className="lead">
                QuizGenerator uses advanced AI to turn your study materials into effective quizzes
                in just three simple steps.
              </p>
            </div>
          </div>

          <div className="feature-cards mt-5">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-file-pdf"></i>
              </div>
              <h3>Upload Your Document</h3>
              <p>
                Simply upload a PDF document that contains the material you want to learn.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-robot"></i>
              </div>
              <h3>AI-Powered Generation</h3>
              <p>
                Our AI analyzes your content and creates tailored quiz questions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Track Your Progress</h3>
              <p>
                Take quizzes, see your results, and monitor your improvement over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="testimonial-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">What Our Users Say</h2>
          </div>

          <div className="testimonial-content">
            <div className="testimonial-card">
              <p>
                "QuizGenerator transformed how I study for medical school exams. The AI generates questions that 
                really test my understanding, not just my memory. It's like having a personal tutor!"
              </p>
              <div className="testimonial-author">- Sarah K., Med Student</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container text-center">
          <h2 className="fw-bold">Ready to Transform Your Learning?</h2>
          <p>
            Join thousands of students who are already studying smarter with QuizGenerator.
          </p>
          <Link to="/signup" className="btn btn-light btn-lg animate-button">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 