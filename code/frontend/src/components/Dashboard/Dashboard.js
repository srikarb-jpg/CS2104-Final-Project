// Dashboard.js - The home page after logging in
//
// This is the main hub of the app. It shows:
//   - A welcome message with the user's name
//   - Navigation cards to each section of the app
//   - A logout button
//
// The user info comes from localStorage where we saved it during login.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

function Dashboard() {
  // Get the stored user object from localStorage
  // We stored it as a JSON string, so we need JSON.parse() to convert it back to an object
  // This is like deserializing an object in Java
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // navigate() lets us redirect to another page programmatically
  const navigate = useNavigate();

  // Track how many pending incoming requests the user has for the badge
  const [pendingCount, setPendingCount] = useState(0);

  // Load the pending request count when the dashboard opens
  useEffect(() => {
    async function loadPendingCount() {
      try {
        const res = await api.get(`/api/users/${user.id}/requests`);
        const pending = res.data.filter(r => r.status === 'pending').length;
        setPendingCount(pending);
      } catch (err) {
        // Not critical — just don't show a badge if it fails
        console.log('Could not load pending requests:', err);
      }
    }
    if (user.id) loadPendingCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // This function logs the user out
  function handleLogout() {
    // Remove the saved login data from the browser
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    console.log('User logged out');

    // Redirect to the login page
    navigate('/login');
  }

  return (
    <div>
      {/* Navigation header bar */}
      <div className="header">
        <h1>HokieStudy</h1>
        <div className="header-nav">
          <Link to="/courses">My Courses</Link>
          <Link to="/availability">Availability</Link>
          <Link to="/matches">Find Partners</Link>
          <Link to="/requests">My Requests</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/profile">Profile</Link>
          {/* This button uses onClick to run our logout function */}
          <button
            className="btn btn-orange btn-small"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Welcome section */}
      <div className="dashboard-welcome">
        <h2>Welcome back, {user.name || 'Hokie'}!</h2>
        <p>
          {user.year ? `${user.year} at Virginia Tech` : 'Virginia Tech Student'}
        </p>
      </div>

      {/* Grid of cards linking to each section */}
      {/* Each card is an <a> tag styled to look like a card */}
      <div className="dashboard-grid">

        <Link to="/courses" className="dashboard-card">
          <h3>My Courses</h3>
          <p>Add the classes you're taking this semester to get matched with classmates</p>
        </Link>

        <Link to="/availability" className="dashboard-card">
          <h3>My Availability</h3>
          <p>Mark the days and times when you're free to study each week</p>
        </Link>

        <Link to="/matches" className="dashboard-card">
          <h3>Find Study Partners</h3>
          <p>See other VT students who share your courses and have time to study</p>
        </Link>

        <Link to="/requests" className="dashboard-card">
          <h3>
            My Requests
            {/* Show a red badge if there are pending incoming requests */}
            {pendingCount > 0 && (
              <span style={{
                marginLeft: '10px',
                backgroundColor: '#861F41',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 9px',
                fontSize: '13px',
                fontWeight: 'bold',
                verticalAlign: 'middle'
              }}>
                {pendingCount}
              </span>
            )}
          </h3>
          <p>View incoming study partner requests and see the status of requests you've sent</p>
        </Link>

        <Link to="/calendar" className="dashboard-card">
          <h3>My Calendar</h3>
          <p>View your study schedule and export it to Google Calendar</p>
        </Link>

      </div>
    </div>
  );
}

export default Dashboard;
