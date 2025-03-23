#!/bin/bash

# Script to deploy to Heroku

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null
then
    echo "Heroku CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku whoami &> /dev/null
then
    echo "You are not logged in to Heroku. Please run 'heroku login' first."
    exit 1
fi

# Get app name
read -p "Enter your Heroku app name: " APP_NAME

# Check if app exists
if ! heroku apps:info --app $APP_NAME &> /dev/null
then
    # Create app if it doesn't exist
    echo "App does not exist. Creating new app '$APP_NAME'..."
    heroku create $APP_NAME
else
    echo "Deploying to existing app '$APP_NAME'..."
fi

# Set environment variables
echo "Setting environment variables..."
read -p "Enter your MongoDB URI: " MONGO_URI
read -p "Enter your JWT secret: " JWT_SECRET
read -p "Enter your Gemini API key: " GEMINI_API_KEY

heroku config:set MONGO_URI="$MONGO_URI" --app $APP_NAME
heroku config:set JWT_SECRET="$JWT_SECRET" --app $APP_NAME
heroku config:set GEMINI_API_KEY="$GEMINI_API_KEY" --app $APP_NAME
heroku config:set NODE_ENV="production" --app $APP_NAME

# Deploy to Heroku
echo "Deploying to Heroku..."
git add .
git commit -m "Deployment commit" || true
git push heroku main

echo "Deployment completed! Your app should be available at: https://$APP_NAME.herokuapp.com" 