FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json files for both backend and frontend
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install

# Copy source code
COPY . ./

# Build frontend
RUN npm run build

# Start production server
CMD ["npm", "start"]