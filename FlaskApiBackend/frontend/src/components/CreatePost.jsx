import { useState, useRef } from 'react';
import { postsAPI } from '../services/api';
import { getCurrentPosition } from '../utils/geolocation';
import './CreatePost.css';

const CreatePost = ({ onPostCreated, onClose }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        setError('Image must be less than 16MB');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const position = await getCurrentPosition();
      
      const formData = new FormData();
      formData.append('image', image);
      formData.append('caption', caption);
      formData.append('latitude', position.latitude);
      formData.append('longitude', position.longitude);

      await postsAPI.create(formData);
      onPostCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Post</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          {error && <div className="error-message">{error}</div>}

          {preview ? (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
              <button 
                type="button" 
                onClick={() => {
                  setImage(null);
                  setPreview(null);
                }} 
                className="remove-image"
              >
                Change Image
              </button>
            </div>
          ) : (
            <div className="upload-area" onClick={() => fileInputRef.current.click()}>
              <div className="upload-icon">📷</div>
              <p>Click to upload photo</p>
              <p className="upload-hint">JPG, PNG, GIF, WEBP (max 16MB)</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="caption-input"
            rows="3"
          />

          <button type="submit" className="submit-button" disabled={loading || !image}>
            {loading ? 'Posting...' : 'Share Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
