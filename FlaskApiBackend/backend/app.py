import os
import psycopg2
from flask import Flask, request, jsonify, send_from_directory
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import timedelta
from PIL import Image
import uuid

from database import get_db, init_db
from utils import haversine_distance, jwt_required_custom

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://locallens-xi.vercel.app"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
jwt = JWTManager(app)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.before_request
def initialize_database():
    if not hasattr(app, "db_initialized"):
        init_db()
        app.db_initialized = True


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ------------------------ AUTH ------------------------ #

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data or not data.get("username") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Username, email, and password are required"}), 400

    username = data["username"]
    email = data["email"]
    password = data["password"]

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    password_hash = generate_password_hash(password)

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (username, email, password_hash)
        )
        user_id = cursor.fetchone()["id"]
        conn.commit()

        access_token = create_access_token(identity=user_id)

        return jsonify({
            "message": "User registered successfully",
            "user": {
                "id": user_id,
                "username": username,
                "email": email
            },
            "access_token": access_token
        }), 201

    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({"error": "Username or email already exists"}), 409

    finally:
        cursor.close()
        conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password are required"}), 400

    username = data["username"]
    password = data["password"]

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    access_token = create_access_token(identity=user["id"])

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        },
        "access_token": access_token
    }), 200


# ------------------------ POSTS ------------------------ #

@app.route("/api/posts", methods=["POST"])
@jwt_required_custom
def create_post():
    user_id = get_jwt_identity()

    if "image" not in request.files:
        return jsonify({"error": "Image file is required"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"}), 400

    caption = request.form.get("caption", "")
    latitude = request.form.get("latitude")
    longitude = request.form.get("longitude")

    if not latitude or not longitude:
        return jsonify({"error": "Latitude and longitude are required"}), 400

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except ValueError:
        return jsonify({"error": "Invalid latitude or longitude"}), 400

    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    file.save(filepath)

    # Validate image
    try:
        img = Image.open(filepath)
        img.verify()
    except Exception:
        os.remove(filepath)
        return jsonify({"error": "Invalid image file"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO posts (user_id, image_path, caption, latitude, longitude) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (user_id, filepath, caption, latitude, longitude)
    )
    post_id = cursor.fetchone()["id"]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Post created successfully",
        "post": {
            "id": post_id,
            "image_path": filepath,
            "caption": caption,
            "latitude": latitude,
            "longitude": longitude
        }
    }), 201


@app.route("/api/feed", methods=["GET"])
@jwt_required_custom
def get_feed():
    user_id = get_jwt_identity()
    latitude = request.args.get("latitude")
    longitude = request.args.get("longitude")

    if not latitude or not longitude:
        return jsonify({"error": "Latitude and longitude are required"}), 400

    try:
        user_lat = float(latitude)
        user_lon = float(longitude)
    except ValueError:
        return jsonify({"error": "Invalid latitude or longitude"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.*, u.username,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = %s) as user_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    """, (user_id,))

    all_posts = cursor.fetchall()
    cursor.close()
    conn.close()

    nearby_posts = []
    for post in all_posts:
        distance = haversine_distance(user_lat, user_lon, post["latitude"], post["longitude"])
        if distance <= 5:
            nearby_posts.append({
                "id": post["id"],
                "user_id": post["user_id"],
                "username": post["username"],
                "image_path": post["image_path"],
                "caption": post["caption"],
                "latitude": post["latitude"],
                "longitude": post["longitude"],
                "created_at": post["created_at"],
                "like_count": post["like_count"],
                "user_liked": bool(post["user_liked"]),
                "distance_miles": round(distance, 2)
            })

    return jsonify({"posts": nearby_posts}), 200


# ------------------------ LIKE ------------------------ #

@app.route("/api/posts/<int:post_id>/like", methods=["POST"])
@jwt_required_custom
def like_post(post_id):
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM posts WHERE id = %s", (post_id,))
    post = cursor.fetchone()

    if not post:
        cursor.close()
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    try:
        cursor.execute(
            "INSERT INTO likes (user_id, post_id) VALUES (%s, %s)",
            (user_id, post_id)
        )
        conn.commit()

        cursor.execute("SELECT COUNT(*) as count FROM likes WHERE post_id = %s", (post_id,))
        like_count = cursor.fetchone()["count"]

        return jsonify({
            "message": "Post liked successfully",
            "like_count": like_count
        }), 201

    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({"error": "You have already liked this post"}), 409

    finally:
        cursor.close()
        conn.close()


@app.route("/api/posts/<int:post_id>/unlike", methods=["DELETE"])
@jwt_required_custom
def unlike_post(post_id):
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM posts WHERE id = %s", (post_id,))
    post = cursor.fetchone()

    if not post:
        cursor.close()
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    cursor.execute(
        "DELETE FROM likes WHERE user_id = %s AND post_id = %s",
        (user_id, post_id)
    )

    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        return jsonify({"error": "You have not liked this post"}), 404

    conn.commit()

    cursor.execute("SELECT COUNT(*) as count FROM likes WHERE post_id = %s", (post_id,))
    like_count = cursor.fetchone()["count"]

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Post unliked successfully",
        "like_count": like_count
    }), 200


# ------------------------ COMMENTS ------------------------ #

@app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
@jwt_required_custom
def get_comments(post_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM posts WHERE id = %s", (post_id,))
    post = cursor.fetchone()

    if not post:
        cursor.close()
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    cursor.execute("""
        SELECT c.*, u.username
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = %s
        ORDER BY c.created_at ASC
    """, (post_id,))

    comments = cursor.fetchall()
    cursor.close()
    conn.close()

    comment_list = [{
        "id": c["id"],
        "user_id": c["user_id"],
        "username": c["username"],
        "text": c["text"],
        "created_at": c["created_at"]
    } for c in comments]

    return jsonify({"comments": comment_list}), 200


@app.route("/api/posts/<int:post_id>/comments", methods=["POST"])
@jwt_required_custom
def add_comment(post_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("text"):
        return jsonify({"error": "Comment text is required"}), 400

    text = data["text"].strip()

    if len(text) == 0:
        return jsonify({"error": "Comment cannot be empty"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM posts WHERE id = %s", (post_id,))
    post = cursor.fetchone()

    if not post:
        cursor.close()
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    cursor.execute(
        "INSERT INTO comments (user_id, post_id, text) VALUES (%s, %s, %s) RETURNING id",
        (user_id, post_id, text)
    )
    comment_id = cursor.fetchone()["id"]
    conn.commit()

    cursor.execute("""
        SELECT c.*, u.username
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = %s
    """, (comment_id,))

    comment = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Comment added successfully",
        "comment": {
            "id": comment["id"],
            "user_id": comment["user_id"],
            "username": comment["username"],
            "text": comment["text"],
            "created_at": comment["created_at"]
        }
    }), 201


# ------------------------ HOME ------------------------ #

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Welcome to LocalLens API",
        "version": "1.0.0"
    }), 200


# ------------------------ RUN APP ------------------------ #

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
