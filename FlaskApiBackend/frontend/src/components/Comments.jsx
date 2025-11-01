import { useState, useEffect } from 'react';
import { commentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Comments.css';

const Comments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await commentsAPI.get(postId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await commentsAPI.create(postId, newComment);
      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        Comments ({comments.length})
      </div>

      <div className="comments-list">
        {loading ? (
          <div className="loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">No comments yet. Be the first!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-avatar">
                {comment.username[0].toUpperCase()}
              </div>
              <div className="comment-content">
                <div className="comment-username">{comment.username}</div>
                <div className="comment-text">{comment.text}</div>
                <div className="comment-time">
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="comment-input"
          disabled={submitting}
        />
        <button 
          type="submit" 
          className="comment-button" 
          disabled={!newComment.trim() || submitting}
        >
          Post
        </button>
      </form>
    </div>
  );
};

export default Comments;
