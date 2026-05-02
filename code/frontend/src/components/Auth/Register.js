// Register.js - The sign-up page component
//
// New users fill out this form to create their HokieStudy account.
// After successful registration, the server logs them in automatically
// and we take them to the course input page so they can add their classes.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

function Register() {
  // State variables - one for each field in the form
  // These are like instance variables that hold the current form values

  const [name, setName] = useState('');       // Student's full name
  const [email, setEmail] = useState('');     // VT email
  const [password, setPassword] = useState(''); // Password
  const [year, setYear] = useState('');       // Freshman, Sophomore, etc.
  const [age, setAge] = useState('');         // Student's age

  const [error, setError] = useState('');     // Error message to display
  const [loading, setLoading] = useState(false); // Loading state

  // navigate() lets us redirect to a different page
  const navigate = useNavigate();

  // This runs when the user submits the registration form
  async function handleRegister(event) {
    event.preventDefault(); // Stop the form from refreshing the page
    setError('');
    setLoading(true);

    try {
      // Send the registration data to our backend
      const response = await api.post('/api/auth/register', {
        name: name,
        email: email,
        password: password,
        year: year,
        age: age
      });

      const { token, user } = response.data;

      // Save login info to localStorage (same as in Login.js)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Account created for:', user.name);

      // After registering, send the user to the courses page first
      // They should add their classes right away so matching can work
      navigate('/courses');

    } catch (err) {
      console.log('Registration error:', err);

      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Registration failed. Make sure the backend server is running.');
      }
    }

    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Join HokieStudy and find your study partners
        </p>

        <form onSubmit={handleRegister}>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hokie Student"
              required
            />
          </div>

          <div className="form-group">
            <label>VT Email Address</label>
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
              placeholder="Choose a password"
              required
            />
          </div>

          {/* A dropdown (select) for the student's year */}
          {/* In HTML, a select is a dropdown menu */}
          <div className="form-group">
            <label>Year at VT</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">-- Select your year --</option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate">Graduate Student</option>
            </select>
          </div>

          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Your age"
              min="16"
              max="99"
            />
          </div>

          {/* Show error if there is one */}
          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Log in here</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
