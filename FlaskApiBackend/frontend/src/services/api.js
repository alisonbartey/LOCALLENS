import axios from 'axios';

const api = axios.create({
  baseURL: 'https://locallens-fuzr.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.setItem("token", response.data.access_token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
};

export const postsAPI = {
  // ✅ Removed manual Content-Type header
  create: (formData) => api.post('/posts', formData),

  getFeed: (latitude, longitude) =>
    api.get('/feed', { params: { latitude, longitude } }),

  like: (postId) => api.post(`/posts/${postId}/like`),
  unlike: (postId) => api.delete(`/posts/${postId}/unlike`),
};

export const commentsAPI = {
  get: (postId) => api.get(`/posts/${postId}/comments`),
  create: (postId, text) => api.post(`/posts/${postId}/comments`, { text }),
};

export default api;
