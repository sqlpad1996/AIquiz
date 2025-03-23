# Quiz Application

A full-stack MERN application for generating and taking quizzes from PDF content.

## Features
- User authentication (signup, login)
- PDF upload for quiz generation
- AI-powered quiz creation using Google's Gemini AI
- Interactive quiz taking interface
- Quiz history and statistics
- Dark/light mode

## Tech Stack
- **Frontend**: React, TypeScript, Bootstrap, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **File Upload**: Multer
- **AI Integration**: Google Gemini AI

## Local Development

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB account
- Gemini AI API key

### Setup
1. Clone the repository
```bash
git clone <repository-url>
cd quiz-app
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Or install individually
cd backend && npm install
cd ../frontend && npm install
```

3. Set up environment variables
```bash
# Copy the example .env
cp backend/.env.example backend/.env

# Edit the .env file with your own values
nano backend/.env
```

4. Start the development servers
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## Deployment Options

### Option 1: Render

1. Create a new Web Service on Render
2. Connect your Git repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables from `.env.example` to the Render dashboard
5. Deploy

### Option 2: Heroku

1. Create a Heroku app
```bash
heroku create your-app-name
```

2. Add MongoDB addon or set MongoDB URI
```bash
heroku addons:create mongodb:sandbox
# Or set your external MongoDB URI
heroku config:set MONGO_URI=your_mongodb_connection_string
```

3. Set environment variables
```bash
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set GEMINI_API_KEY=your_gemini_api_key
heroku config:set NODE_ENV=production
```

4. Deploy to Heroku
```bash
git push heroku main
```

### Option 3: Vercel/Netlify + Separate Backend

#### Frontend (Vercel/Netlify)
1. Connect your Git repository
2. Configure:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
3. Add environment variable:
   - `REACT_APP_API_URL=https://your-backend-url.com`

#### Backend (Render/Heroku/DigitalOcean)
1. Deploy backend separately following Option 1 or 2
2. Ensure CORS is configured properly to allow requests from your frontend domain

## Environment Variables

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT authentication
- `GEMINI_API_KEY`: Google Gemini API key for AI quiz generation
- `NODE_ENV`: Set to "production" for production deployment
- `PORT`: Port for the backend server (default: 5000)

## License
ISC 