import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function loadPendingCount() {
      try {
        const res = await api.get(`/api/users/${user.id}/requests`);
        const pending = res.data.filter(r => r.status === 'pending').length;
        setPendingCount(pending);
      } catch (err) {
        console.log('Could not load pending requests:', err);
      }
    }
    if (user.id) loadPendingCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div>
      <div className="header">
        <h1>HokieStudy</h1>
        <div className="header-nav">
          <Link to="/courses">My Courses</Link>
          <Link to="/availability">Availability</Link>
          <Link to="/matches">Find Partners</Link>
          <Link to="/requests">My Requests</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/profile">Profile</Link>
          <button className="btn btn-orange btn-small" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-welcome">
        <h2>Welcome back, {user.name || 'Hokie'}!</h2>
        <p>{user.year ? `${user.year} at Virginia Tech` : 'Virginia Tech Student'}</p>
      </div>

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
