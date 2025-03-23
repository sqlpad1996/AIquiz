#!/bin/bash

# Script to prepare frontend and backend for separate deployments

# Build frontend for static hosting (Vercel, Netlify, etc.)
echo "Building frontend..."
cd frontend
npm install

# Ask for backend URL
read -p "Enter your backend API URL (e.g., https://your-api.render.com): " API_URL

# Create .env file for frontend with API URL
echo "REACT_APP_API_URL=$API_URL" > .env

# Build frontend with the API URL
npm run build

echo "Frontend build complete! Deploy the 'frontend/build' folder to your static hosting service (Vercel, Netlify, etc.)"

# Prepare backend for separate deployment
echo "Preparing backend..."
cd ../backend
npm install

# Create or update .env.production for backend
echo "Creating .env.production for backend..."
echo "PORT=5000" > .env.production
echo "NODE_ENV=production" >> .env.production
read -p "Enter your MongoDB URI: " MONGO_URI
echo "MONGO_URI=$MONGO_URI" >> .env.production
read -p "Enter your JWT secret: " JWT_SECRET
echo "JWT_SECRET=$JWT_SECRET" >> .env.production
read -p "Enter your Gemini API key: " GEMINI_API_KEY
echo "GEMINI_API_KEY=$GEMINI_API_KEY" >> .env.production

# Update CORS in server.js for the frontend domain
read -p "Enter your frontend domain (e.g., https://your-app.vercel.app): " FRONTEND_DOMAIN

# Create a backup of server.js
cp server.js server.js.bak

# Update CORS in server.js
sed -i "s/app.use(cors());/app.use(cors({ origin: '$FRONTEND_DOMAIN', credentials: true }));/" server.js

echo "Backend preparation complete! Deploy the 'backend' folder to your backend hosting service (Render, Heroku, etc.)" 