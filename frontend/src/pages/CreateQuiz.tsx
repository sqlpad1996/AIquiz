import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import quizService from '../api/quizService';
import { useTheme } from '../context/ThemeContext';

const CreateQuiz: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [fileError, setFileError] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { isDark } = useTheme();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError('');
    
    if (!selectedFile) {
      setFile(null);
      setFileSize('');
      return;
    }
    
    // Check file type
    if (selectedFile.type !== 'application/pdf') {
      setFileError('Please upload a PDF file');
      setFile(null);
      setFileSize('');
      return;
    }
    
    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (selectedFile.size > maxSize) {
      setFileError(`File size exceeds 25MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)`);
      setFile(null);
      setFileSize('');
      return;
    }
    
    // Format file size for display
    const formattedSize = selectedFile.size < 1024 * 1024 
      ? `${(selectedFile.size / 1024).toFixed(2)} KB` 
      : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;
    
    setFileSize(formattedSize);
    setFile(selectedFile);
    setCurrentStep(2);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFileError('');
      
      // Check file type
      if (droppedFile.type !== 'application/pdf') {
        setFileError('Please upload a PDF file');
        return;
      }
      
      // Check file size (25MB limit)
      const maxSize = 25 * 1024 * 1024; // 25MB in bytes
      if (droppedFile.size > maxSize) {
        setFileError(`File size exceeds 25MB limit (${(droppedFile.size / (1024 * 1024)).toFixed(2)}MB)`);
        return;
      }
      
      // Format file size for display
      const formattedSize = droppedFile.size < 1024 * 1024 
        ? `${(droppedFile.size / 1024).toFixed(2)} KB` 
        : `${(droppedFile.size / (1024 * 1024)).toFixed(2)} MB`;
      
      setFileSize(formattedSize);
      setFile(droppedFile);
      setError('');
      setCurrentStep(2);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!file) {
      setError('Please upload a PDF file');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('quizTitle', title);
    formData.append('difficulty', difficulty);
    formData.append('numQuestions', numQuestions.toString());

    try {
      const createdQuiz = await quizService.createQuiz(formData);
      console.log('Quiz created:', createdQuiz);
      navigate(`/quiz/${createdQuiz._id}`);
    } catch (err: any) {
      console.error('Error creating quiz:', err);
      setError(err.response?.data?.message || 'Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get difficulty color
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  };

  const generatePdf = () => {
    if (generatingPdf) return;
    
    setGeneratingPdf(true);
    setTimeout(() => {
      try {
        // Generate a simple example PDF
        const { jsPDF } = require('jspdf');
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text('Sample Study Material', 20, 20);
        
        doc.setFontSize(12);
        doc.text('This is a sample PDF for demonstration purposes.', 20, 30);
        doc.text('You can use this to create a quiz if you don\'t have your own PDF.', 20, 40);
        
        // Add some sample content
        const sampleContent = [
          'In 1972, a scale called the Richter scale was developed to measure earthquake intensity.',
          'The industrial revolution began in Great Britain in the late 18th century.',
          'Water covers about 71% of the Earth\'s surface.',
          'The human body has 206 bones.',
          'JavaScript was created in 10 days by Brendan Eich in 1995.',
          'The first artificial satellite, Sputnik 1, was launched by the Soviet Union in 1957.',
          'The photosynthesis process converts carbon dioxide and water into glucose and oxygen.'
        ];
        
        let y = 60;
        sampleContent.forEach(line => {
          doc.text(line, 20, y);
          y += 10;
        });
        
        // Save the PDF
        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], 'sample.pdf', { type: 'application/pdf' });
        
        // Set the file and update UI
        setFile(pdfFile);
        setFileSize(pdfFile.size < 1024 * 1024 
          ? `${(pdfFile.size / 1024).toFixed(2)} KB` 
          : `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB`);
        setFileError('');
        setError('');
        setCurrentStep(2);
      } catch (err) {
        console.error('Error generating sample PDF:', err);
        setError('Failed to generate sample PDF. Please try uploading your own document.');
      } finally {
        setGeneratingPdf(false);
      }
    }, 1500);
  };

  return (
    <div className="create-quiz-container py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="text-center mb-5">
              <h1 className="display-5 fw-bold mb-2">Create Your Quiz</h1>
              <p className="lead text-muted">Transform your study materials into interactive quizzes with AI</p>
              
              {/* Progress Steps */}
              <div className="d-flex justify-content-center mt-5">
                <div className="quiz-creator-progress">
                  <div className="progress-step-container">
                    <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                    <div className="d-flex">
                      <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep === 1 ? 'current' : ''}`}>
                        <div className="step-circle">
                          {currentStep > 1 ? <i className="fas fa-check"></i> : 1}
                        </div>
                        <div className="step-label">Upload Document</div>
                      </div>
                      <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep === 2 ? 'current' : ''}`}>
                        <div className="step-circle">
                          {currentStep > 2 ? <i className="fas fa-check"></i> : 2}
                        </div>
                        <div className="step-label">Quiz Settings</div>
                      </div>
                      <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep === 3 ? 'current' : ''}`}>
                        <div className="step-circle">
                          {currentStep > 3 ? <i className="fas fa-check"></i> : 3}
                        </div>
                        <div className="step-label">Generate Quiz</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i> {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Upload Section */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4 quiz-creator-card">
                    <div className="card-body p-lg-5 p-4">
                      <h3 className="card-title mb-4">
                        <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary me-2">1</span>
                        Upload Your PDF Document
                      </h3>
                      
                      <div 
                        className={`file-upload-area p-5 rounded-4 ${dragActive ? 'file-upload-active pulse' : ''} ${file ? 'file-upload-success' : ''}`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileInput}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="d-none"
                          id="pdfFile"
                          accept=".pdf"
                          onChange={handleFileChange}
                        />
                        
                        {file ? (
                          <div className="selected-file">
                            <div className="pdf-icon d-inline-flex p-3 rounded-circle mb-3">
                              <i className="fas fa-file-pdf text-danger fa-3x"></i>
                            </div>
                            <h4 className="mb-1 fw-medium">{file.name}</h4>
                            <p className="mb-3 text-muted">
                              <span className="badge bg-light text-dark me-2">
                                <i className="fas fa-hdd me-1"></i> {fileSize}
                              </span>
                              <span className="badge bg-success">
                                <i className="fas fa-check me-1"></i> Ready to use
                              </span>
                            </p>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-secondary px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                                setCurrentStep(1);
                              }}
                            >
                              <i className="fas fa-exchange-alt me-1"></i> Change File
                            </button>
                          </div>
                        ) : (
                          <div className="upload-content">
                            <div className="upload-icon d-inline-flex p-4 rounded-circle mb-4">
                              <i className="fas fa-cloud-upload-alt text-primary fa-3x"></i>
                            </div>
                            <h4 className="fw-bold mb-3">Drag & Drop Your PDF Here</h4>
                            <p className="text-muted mb-4">or click to browse files from your computer</p>
                            <div className="d-flex flex-wrap justify-content-center gap-3">
                              <div className="upload-info-badge">
                                <i className="fas fa-file-pdf me-1"></i> PDF files only
                              </div>
                              <div className="upload-info-badge">
                                <i className="fas fa-hdd me-1"></i> Max 25MB
                              </div>
                              <div className="upload-info-badge">
                                <i className="fas fa-lock me-1"></i> Secure upload
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {fileError && (
                        <div className="alert alert-danger mt-3">
                          <i className="fas fa-exclamation-triangle me-2"></i> {fileError}
                        </div>
                      )}
                      
                      <div className="text-center mt-4">
                        <p className="text-muted">Don't have a PDF ready?</p>
                        <button 
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={generatePdf}
                          disabled={generatingPdf}
                        >
                          {generatingPdf ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Generating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-magic me-2"></i> Generate a Sample PDF
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quiz Settings Section */}
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm rounded-4 h-100 quiz-creator-card">
                    <div className="card-body p-lg-5 p-4">
                      <h3 className="card-title mb-4">
                        <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary me-2">2</span>
                        Quiz Details
                      </h3>
                      
                      <div className="mb-4">
                        <label htmlFor="title" className="form-label fw-medium">
                          <i className="fas fa-heading me-2 text-primary"></i> Quiz Title
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg rounded-3"
                          id="title"
                          placeholder="E.g., Introduction to Physics, History 101"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                        <div className="form-text">
                          Give your quiz a descriptive name related to the content
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="difficulty" className="form-label fw-medium">
                          <i className={`fas fa-mountain me-2 text-${getDifficultyColor()}`}></i> Difficulty Level
                        </label>
                        <div className="difficulty-selector">
                          <select
                            className={`form-select form-control-lg rounded-3 bg-${getDifficultyColor()} bg-opacity-10`}
                            id="difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                          <div className="difficulty-indicator d-flex align-items-center mt-2">
                            <span className={`badge bg-${getDifficultyColor()} me-2`}>{difficulty}</span>
                            <small>
                              {difficulty === 'easy' && 'Basic recall and simple concepts'}
                              {difficulty === 'medium' && 'Application and understanding'}
                              {difficulty === 'hard' && 'Analysis and complex problem solving'}
                            </small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="numQuestions" className="form-label fw-medium">
                          <i className="fas fa-list-ol me-2 text-primary"></i> Number of Questions
                        </label>
                        <div className="d-flex align-items-center">
                          <input
                            type="range"
                            className="form-range flex-grow-1 me-3"
                            id="numQuestions"
                            min="5"
                            max="20"
                            step="1"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                          />
                          <span className="badge bg-primary px-3 py-2 fs-6">{numQuestions}</span>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted">5</small>
                          <small className="text-muted">10</small>
                          <small className="text-muted">15</small>
                          <small className="text-muted">20</small>
                        </div>
                        <div className="form-text mt-2">
                          <i className="fas fa-info-circle me-1"></i> We recommend 5-10 for short documents, 10-20 for longer ones
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* How It Works Section */}
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm rounded-4 h-100 quiz-creator-card">
                    <div className="card-body p-lg-5 p-4">
                      <h3 className="card-title mb-4">
                        <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary me-2">?</span>
                        How It Works
                      </h3>
                      
                      <div className="process-steps">
                        <div className="step d-flex mb-3">
                          <div className="step-icon me-3">
                            <div className="icon-circle bg-primary bg-opacity-10 text-primary">
                              <i className="fas fa-upload"></i>
                            </div>
                          </div>
                          <div className="step-content">
                            <h5>1. Upload your document</h5>
                            <p className="text-muted mb-0">We'll extract the content from your PDF</p>
                          </div>
                        </div>
                        
                        <div className="step d-flex mb-3">
                          <div className="step-icon me-3">
                            <div className="icon-circle bg-primary bg-opacity-10 text-primary">
                              <i className="fas fa-cogs"></i>
                            </div>
                          </div>
                          <div className="step-content">
                            <h5>2. AI analysis</h5>
                            <p className="text-muted mb-0">Our AI identifies key concepts to create questions</p>
                          </div>
                        </div>
                        
                        <div className="step d-flex mb-3">
                          <div className="step-icon me-3">
                            <div className="icon-circle bg-primary bg-opacity-10 text-primary">
                              <i className="fas fa-question-circle"></i>
                            </div>
                          </div>
                          <div className="step-content">
                            <h5>3. Take the quiz</h5>
                            <p className="text-muted mb-0">Answer multiple-choice questions based on your document</p>
                          </div>
                        </div>
                        
                        <div className="step d-flex">
                          <div className="step-icon me-3">
                            <div className="icon-circle bg-primary bg-opacity-10 text-primary">
                              <i className="fas fa-chart-line"></i>
                            </div>
                          </div>
                          <div className="step-content">
                            <h5>4. Review and improve</h5>
                            <p className="text-muted mb-0">See your results and retry to enhance retention</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="quiz-tip mt-4 rounded-3 p-3">
                        <div className="d-flex">
                          <div className="me-3">
                            <i className="fas fa-lightbulb text-warning"></i>
                          </div>
                          <div>
                            <p className="mb-0"><strong>Tip:</strong> For best results, use documents with clear text that's well-structured and organized.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4 quiz-creator-card">
                    <div className="card-body p-4">
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                        <div className="mb-3 mb-sm-0">
                          <h4 className="mb-1">Ready to create your quiz?</h4>
                          <p className="text-muted mb-0">Our AI will analyze your document and generate questions</p>
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg px-5 py-3 generate-quiz-btn"
                          disabled={loading || !file || !title}
                        >
                          {loading ? (
                            <div className="d-flex align-items-center">
                              <div className="spinner-border spinner-border-sm me-3" role="status"></div>
                              <span>Generating Quiz...</span>
                            </div>
                          ) : (
                            <span><i className="fas fa-magic me-2"></i> Generate Quiz</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz; 