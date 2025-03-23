#!/bin/bash

# Script to prepare and deploy to Render

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Start the server (for local testing of the production build)
echo "Starting server..."
cd backend
npm start 