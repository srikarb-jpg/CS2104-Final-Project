// Profile.js - View and edit the user's profile
//
// Users can update their name, year, and age here.
// The current values are loaded from the backend when the page opens.
// useEffect() runs code automatically when the component first appears on screen.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function Profile() {
  // Get the logged-in user's info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Form field values - initialized with current user data
  // The || '' means "use empty string if the value is null/undefined"
  const [name, setName] = useState(user.name || '');
  const [year, setYear] = useState(user.year || '');
  const [age, setAge] = useState(user.age || '');

  // Status messages for the user
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // useEffect is like a constructor for loading data.
  // The function inside runs once when the component first appears (mounts).
  // The [] at the end means "don't run this again unless the component remounts"
  useEffect(() => {
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the latest profile data from the server
  // (In case it was updated from another browser tab)
  async function loadProfile() {
    try {
      const response = await api.get(`/api/users/${user.id}`);
      const profileData = response.data;

      // Update the form fields with the server's current values
      setName(profileData.name || '');
      setYear(profileData.year || '');
      setAge(profileData.age || '');
    } catch (err) {
      console.log('Could not load profile:', err);
    }
  }

  // Save the updated profile to the server
  async function handleSave(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // PUT request updates existing data (vs POST which creates new data)
      await api.put(`/api/users/${user.id}`, {
        name: name,
        year: year,
        age: age
      });

      // Also update localStorage so the dashboard shows the new name
      const updatedUser = { ...user, name, year, age };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage('Profile updated successfully!');
      console.log('Profile saved');

    } catch (err) {
      console.log('Save error:', err);
      setError('Could not save profile. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h1>HokieStudy</h1>
        <div className="header-nav">
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </div>

      <div className="card">
        <h2>My Profile</h2>

        <form onSubmit={handleSave}>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            {/* Email can't be changed - just display it */}
            {/* disabled makes the field non-editable */}
            <input
              type="email"
              value={user.email || ''}
              disabled
              style={{ backgroundColor: '#f0f0f0', color: '#888' }}
            />
          </div>

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

          {/* Show success or error messages */}
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Profile;
