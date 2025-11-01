# LocalLens API

A Flask-based REST API for a geolocation-based photo-sharing social media application.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Photo Sharing**: Upload photos with captions and geolocation data
- **Location-Based Feed**: Discover posts within 5 miles of your location using the haversine formula
- **Social Interactions**: Like/unlike posts and add comments
- **SQLite Database**: Lightweight database with proper relational integrity

## API Endpoints

### Authentication

#### Register User
```
POST /api/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

#### Login
```
POST /api/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepass123"
}
```

### Posts

#### Create Post
```
POST /api/posts
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

image: <file>
caption: "Amazing sunset!"
latitude: 37.7749
longitude: -122.4194
```

#### Get Feed
```
GET /api/feed?latitude=37.7749&longitude=-122.4194
Authorization: Bearer <jwt_token>
```

### Social Features

#### Like Post
```
POST /api/posts/{post_id}/like
Authorization: Bearer <jwt_token>
```

#### Unlike Post
```
DELETE /api/posts/{post_id}/unlike
Authorization: Bearer <jwt_token>
```

#### Get Comments
```
GET /api/posts/{post_id}/comments
Authorization: Bearer <jwt_token>
```

#### Add Comment
```
POST /api/posts/{post_id}/comments
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "text": "Great photo!"
}
```

## Technology Stack

- **Flask**: Web framework
- **Flask-JWT-Extended**: JWT authentication
- **Flask-CORS**: Cross-origin resource sharing
- **SQLite**: Database
- **Pillow**: Image processing
- **Werkzeug**: Security utilities

## Database Schema

### Users
- id (PRIMARY KEY)
- username (UNIQUE)
- email (UNIQUE)
- password_hash
- created_at

### Posts
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- image_path
- caption
- latitude
- longitude
- created_at

### Likes
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- post_id (FOREIGN KEY → posts.id)
- created_at
- UNIQUE(user_id, post_id)

### Comments
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- post_id (FOREIGN KEY → posts.id)
- text
- created_at

## Running the API

The API is configured to run automatically. It listens on port 5000.

## Testing

A test script is provided to verify basic functionality:

```bash
python test_api.py
```

## Configuration

### Environment Variables
- `SESSION_SECRET`: JWT secret key (defaults to development key)

### Settings
- JWT tokens expire after 7 days
- Maximum upload size: 16MB
- Supported image formats: PNG, JPG, JPEG, GIF, WEBP
- Geolocation radius: 5 miles

## Security Features

- Passwords are hashed using Werkzeug's security functions
- JWT tokens for stateless authentication
- File upload validation (type, size, content verification)
- SQL injection prevention through parameterized queries
- Foreign key constraints enforced in SQLite

## Important Notes

- This API uses Flask's development server. For production, use a proper WSGI server like Gunicorn
- Images are stored locally in the `uploads/` directory
- The SQLite database file (`locallens.db`) is created automatically on first run
