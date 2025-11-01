# LocalLens - Geolocation-Based Photo-Sharing Social Media App

## Overview
LocalLens is a full-stack Instagram-like social media application where users can share photos from their location and discover posts from people within a 5-mile radius. Built with React frontend and Flask backend.

## Project Status
- **Created**: November 1, 2025
- **Current State**: Full-stack MVP complete and functional
- **Technology Stack**: 
  - **Frontend**: React, Vite, Axios
  - **Backend**: Flask, SQLite, JWT authentication, PIL for image handling

## Features

### Frontend
- Beautiful, mobile-friendly Instagram-like UI
- User registration and login with validation
- Camera/photo upload for creating posts
- Geolocation-based feed showing nearby posts with distance
- Real-time like/unlike functionality with optimistic UI updates
- Comments section for each post
- JWT token-based authentication
- Responsive design with gradient purple theme

### Backend
- User registration and authentication with JWT tokens
- Image upload and storage with validation
- Geolocation-based feed using haversine formula (5-mile radius)
- Social features: likes and comments
- Image serving via Flask route
- SQLite database with proper foreign key constraints
- CORS support for cross-origin requests

## API Endpoints

### Authentication
- `POST /api/register` - Register new user (returns JWT token)
- `POST /api/login` - Login existing user (returns JWT token)

### Posts
- `POST /api/posts` - Create post with image upload (requires JWT)
- `GET /api/feed` - Get posts within 5 miles based on latitude/longitude (requires JWT)

### Social Features
- `POST /api/posts/<id>/like` - Like a post (requires JWT)
- `DELETE /api/posts/<id>/unlike` - Unlike a post (requires JWT)
- `GET /api/posts/<id>/comments` - Get all comments for a post (requires JWT)
- `POST /api/posts/<id>/comments` - Add comment to a post (requires JWT)

## Database Schema

### Tables
1. **users**: id, username, email, password_hash, created_at
2. **posts**: id, user_id, image_path, caption, latitude, longitude, created_at
3. **likes**: id, user_id, post_id, created_at (unique constraint on user_id + post_id)
4. **comments**: id, user_id, post_id, text, created_at

## Project Structure
```
.
├── backend/
│   ├── app.py          # Main Flask API with all endpoints
│   ├── database.py     # Database schema and connection
│   ├── utils.py        # Utility functions (haversine, JWT)
│   ├── uploads/        # Uploaded image storage
│   └── locallens.db    # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/ # React components (Login, Register, Feed, Post, etc.)
│   │   ├── contexts/   # Auth context for JWT management
│   │   ├── services/   # API service layer (axios)
│   │   └── utils/      # Utility functions (geolocation)
│   ├── vite.config.js  # Vite configuration with proxy
│   └── package.json    # Frontend dependencies
└── replit.md           # Project documentation
```

## Recent Changes
- **Nov 1, 2025**: Complete full-stack implementation
  - **Backend**: Created Flask REST API with all endpoints
    - JWT authentication with Flask-JWT-Extended
    - SQLite database with foreign key constraints
    - Image upload and serving functionality
    - Geolocation-based feed using haversine formula
    - Social features (likes, comments) with proper constraints
  - **Frontend**: Created React application with Vite
    - Instagram-like mobile-friendly UI
    - Login/Register pages with validation
    - Post creation with image upload and geolocation
    - Feed component with distance display
    - Real-time like/unlike with optimistic UI
    - Comments section for each post
    - JWT token management with Auth context
  - **Integration**: Configured Vite proxy for API calls
  - **Documentation**: Created README.md and API_EXAMPLES.md

## Configuration
- JWT tokens expire after 7 days
- Maximum upload file size: 16MB
- Supported image formats: PNG, JPG, JPEG, GIF, WEBP
- Geolocation radius: 5 miles

## Environment Variables
- `SESSION_SECRET`: JWT secret key (defaults to dev key if not set)

## User Preferences
None specified yet.
