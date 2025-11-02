import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = ({ onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return false;
    }

    try {
      // Request location permission
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Location permission granted:', position.coords);
            resolve(position);
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      });
      return true;
    } catch (error) {
      if (error.code === 1) {
        // Permission denied
        setError('Location access is required to use LocalLens. Please enable location in your browser settings.');
      } else if (error.code === 2) {
        // Position unavailable
        setError('Unable to determine your location. Please check your device settings.');
      } else if (error.code === 3) {
        // Timeout
        setError('Location request timed out. Please try again.');
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    // First, attempt login
    const result = await login(username, password);
    
    if (result.success) {
      // Login successful, now request location permission
      const locationGranted = await requestLocationPermission();
      
      if (!locationGranted) {
        // Location denied but user is logged in
        // You can decide whether to logout or let them continue
        console.warn('User denied location access');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="app-logo">LocalLens</h1>
        <p className="app-tagline">Share moments from your neighborhood</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="auth-input"
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            disabled={loading}
          />
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="link-button">
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
