// Login.js - The login page component
//
// This is the first page users see when they visit HokieStudy.
// It shows a form where they can enter their email and password.
// After successful login, it saves the token and takes them to the dashboard.
//
// In React, a "component" is like a Java class that returns HTML (called JSX).
// useState() is like declaring instance variables - when they change, the UI updates.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

function Login() {
  // These are like instance variables in Java.
  // useState('') sets the initial value to an empty string.
  // setEmail is the "setter" function - calling it updates the value AND re-renders the component.

  // Holds the email the user is typing
  const [email, setEmail] = useState('');

  // Holds the password the user is typing
  const [password, setPassword] = useState('');

  // If there's an error (wrong password, etc.), we show it here
  const [error, setError] = useState('');

  // Shows "Logging in..." while waiting for the server to respond
  const [loading, setLoading] = useState(false);

  // useNavigate() gives us a function to redirect to other pages
  // This is like window.location.href but works with React Router
  const navigate = useNavigate();

  // This function runs when the user clicks the "Log In" button
  async function handleLogin(event) {
    // Prevent the form from refreshing the page (default HTML form behavior)
    event.preventDefault();

    // Clear any previous error message
    setError('');
    setLoading(true);

    try {
      // Make a POST request to our backend login route
      // api.post() sends data to the server and waits for a response
      const response = await api.post('/api/auth/login', {
        email: email,
        password: password
      });

      // The server sent back a token and user info
      const { token, user } = response.data;

      // Save the token to localStorage so we can use it in future requests
      // localStorage keeps data even when the user closes the browser tab
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Convert object to string to store it

      console.log('Logged in successfully as:', user.name);

      // Redirect the user to the dashboard
      navigate('/dashboard');

    } catch (err) {
      // Something went wrong - show the error message from the server
      console.log('Login error:', err);

      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Could not connect to the server. Make sure the backend is running.');
      }
    }

    setLoading(false);
  }

  // The return statement is what gets shown on screen (JSX = JavaScript + HTML)
  // It looks like HTML but it's actually JavaScript
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>HokieStudy</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Virginia Tech Study Partner Finder
        </p>

        {/* onSubmit runs our handleLogin function when the form is submitted */}
        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label>Email Address</label>
            {/* value={email} links this input to our email state variable */}
            {/* onChange updates the state every time the user types a character */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourpid@vt.edu"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          {/* Only show the error message if there is one */}
          {error && <div className="error-message">{error}</div>}

          {/* disabled={loading} grays out the button while waiting for the server */}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
