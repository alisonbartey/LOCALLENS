# LocalLens API Usage Examples

## Quick Start with curl

### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "access_token": "eyJhbGc..."
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "access_token": "eyJhbGc..."
}
```

### 3. Create a Post with Image

```bash
# Save your JWT token from login/register
TOKEN="your_jwt_token_here"

# Create a post with an image
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/your/photo.jpg" \
  -F "caption=Beautiful sunset at the beach!" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

**Response:**
```json
{
  "message": "Post created successfully",
  "post": {
    "id": 1,
    "image_path": "uploads/uuid_photo.jpg",
    "caption": "Beautiful sunset at the beach!",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

### 4. Get Feed (Posts within 5 miles)

```bash
curl -X GET "http://localhost:5000/api/feed?latitude=37.7749&longitude=-122.4194" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "posts": [
    {
      "id": 1,
      "user_id": 1,
      "username": "johndoe",
      "image_path": "uploads/uuid_photo.jpg",
      "caption": "Beautiful sunset at the beach!",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "created_at": "2025-11-01 09:00:00",
      "like_count": 0,
      "user_liked": false,
      "distance_miles": 0.0
    }
  ]
}
```

### 5. Like a Post

```bash
curl -X POST http://localhost:5000/api/posts/1/like \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "message": "Post liked successfully",
  "like_count": 1
}
```

### 6. Unlike a Post

```bash
curl -X DELETE http://localhost:5000/api/posts/1/unlike \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "message": "Post unliked successfully",
  "like_count": 0
}
```

### 7. Get Comments for a Post

```bash
curl -X GET http://localhost:5000/api/posts/1/comments \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "comments": [
    {
      "id": 1,
      "user_id": 2,
      "username": "janedoe",
      "text": "Amazing photo!",
      "created_at": "2025-11-01 09:05:00"
    }
  ]
}
```

### 8. Add a Comment to a Post

```bash
curl -X POST http://localhost:5000/api/posts/1/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Great shot!"
  }'
```

**Response:**
```json
{
  "message": "Comment added successfully",
  "comment": {
    "id": 2,
    "user_id": 1,
    "username": "johndoe",
    "text": "Great shot!",
    "created_at": "2025-11-01 09:10:00"
  }
}
```

## Python Example

```python
import requests

BASE_URL = "http://localhost:5000"

# Register
response = requests.post(f"{BASE_URL}/api/register", json={
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass123"
})
token = response.json()["access_token"]

# Get feed
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    f"{BASE_URL}/api/feed",
    headers=headers,
    params={"latitude": 37.7749, "longitude": -122.4194}
)
posts = response.json()["posts"]

# Create post
files = {"image": open("photo.jpg", "rb")}
data = {
    "caption": "Beautiful sunset!",
    "latitude": "37.7749",
    "longitude": "-122.4194"
}
response = requests.post(
    f"{BASE_URL}/api/posts",
    headers=headers,
    files=files,
    data=data
)
```

## JavaScript Example

```javascript
const BASE_URL = 'http://localhost:5000';

// Register
const registerResponse = await fetch(`${BASE_URL}/api/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'securepass123'
  })
});
const { access_token } = await registerResponse.json();

// Get feed
const feedResponse = await fetch(
  `${BASE_URL}/api/feed?latitude=37.7749&longitude=-122.4194`,
  {
    headers: { 'Authorization': `Bearer ${access_token}` }
  }
);
const { posts } = await feedResponse.json();

// Like a post
await fetch(`${BASE_URL}/api/posts/1/like`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Username, email, and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid username or password"
}
```

### 404 Not Found
```json
{
  "error": "Post not found"
}
```

### 409 Conflict
```json
{
  "error": "Username or email already exists"
}
```

## Notes

- All protected endpoints require the `Authorization: Bearer <token>` header
- JWT tokens expire after 7 days
- Maximum image upload size is 16MB
- Supported image formats: PNG, JPG, JPEG, GIF, WEBP
- Geolocation feed returns posts within 5 miles of the specified coordinates
