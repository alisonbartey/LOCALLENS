import { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import { getCurrentPosition } from '../utils/geolocation';
import { useAuth } from '../contexts/AuthContext';
import Post from './Post';
import CreatePost from './CreatePost';
import './Feed.css';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [location, setLocation] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    requestLocationAndLoadFeed();
  }, []);

  const requestLocationAndLoadFeed = async () => {
    setLoading(true);
    setError('');
    
    try {
      const position = await getCurrentPosition();
      setLocation(position);
      await loadFeed(position);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadFeed = async (position) => {
    try {
      const response = await postsAPI.getFeed(position.latitude, position.longitude);
      setPosts(response.data.posts);
    } catch (err) {
      setError('Failed to load feed. Please try again.');
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    if (location) {
      loadFeed(location);
    }
  };

  const handleRefresh = () => {
    if (location) {
      setLoading(true);
      loadFeed(location);
    } else {
      requestLocationAndLoadFeed();
    }
  };

  return (
    <div className="feed-container">
      <header className="feed-header">
        <h1 className="feed-logo">LocalLens</h1>
        <div className="header-actions">
          <button onClick={() => setShowCreatePost(true)} className="create-button">
            +
          </button>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="feed-content">
        {loading ? (
          <div className="feed-loading">
            <div className="spinner"></div>
            <p>Loading nearby posts...</p>
          </div>
        ) : error ? (
          <div className="feed-error">
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <div className="empty-icon">📸</div>
            <h2>No posts nearby</h2>
            <p>Be the first to share something from your area!</p>
            <button onClick={() => setShowCreatePost(true)} className="create-first-button">
              Create Post
            </button>
          </div>
        ) : (
          <div className="posts-list">
            <div className="feed-info">
              Showing {posts.length} {posts.length === 1 ? 'post' : 'posts'} within 5 miles
            </div>
            {posts.map((post) => (
              <Post key={post.id} post={post} onUpdate={handleRefresh} />
            ))}
          </div>
        )}
      </div>

      {showCreatePost && (
        <CreatePost
          onPostCreated={handlePostCreated}
          onClose={() => setShowCreatePost(false)}
        />
      )}
    </div>
  );
};

export default Feed;
