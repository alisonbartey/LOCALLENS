import { useState } from 'react';
import { postsAPI } from '../services/api';
import Comments from './Comments';
import './Post.css';

const Post = ({ post, onUpdate }) => {
  const [liked, setLiked] = useState(post.user_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    const wasLiked = liked;
    const prevCount = likeCount;

    setLiked(!liked);
    setLikeCount(prevCount + (liked ? -1 : 1));

    try {
      if (wasLiked) {
        await postsAPI.unlike(post.id);
      } else {
        await postsAPI.like(post.id);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      setLiked(wasLiked);
      setLikeCount(prevCount);
      console.error('Failed to toggle like:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    return `http://localhost:3000/${path}`;
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-user">
          <div className="avatar">{post.username[0].toUpperCase()}</div>
          <div>
            <div className="username">{post.username}</div>
            <div className="location">
              📍 {post.distance_miles} {post.distance_miles === 1 ? 'mile' : 'miles'} away
            </div>
          </div>
        </div>
      </div>

      <div className="post-image">
        <img src={getImageUrl(post.image_path)} alt={post.caption} />
      </div>

      <div className="post-actions">
        <button 
          onClick={handleLike} 
          className={`action-button ${liked ? 'liked' : ''}`}
          disabled={loading}
        >
          {liked ? '❤️' : '🤍'}
        </button>
        <button 
          onClick={() => setShowComments(!showComments)} 
          className="action-button"
        >
          💬
        </button>
      </div>

      <div className="post-info">
        {likeCount > 0 && (
          <div className="likes">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </div>
        )}
        {post.caption && (
          <div className="caption">
            <span className="username">{post.username}</span> {post.caption}
          </div>
        )}
        <div className="timestamp">
          {new Date(post.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {showComments && <Comments postId={post.id} />}
    </div>
  );
};

export default Post;
