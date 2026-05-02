// Matches.js - Find students who share your courses
//
// Shows matched students with:
//   - A colored percentage bar showing how strong the match is
//   - "Request to Study" button to send a study partner request
//   - Shared courses and overlapping free times

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function Matches() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Track which request buttons have been clicked so we can show feedback
  // Key = matched user's ID, Value = 'sending', 'sent', or 'error'
  const [requestStatus, setRequestStatus] = useState({});

  useEffect(() => {
    loadMatches();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMatches() {
    setLoading(true);
    try {
      const response = await api.get(`/api/users/${user.id}/matches`);
      setMatches(response.data);

      // Also check which requests we've already sent, so the buttons start correct
      const sentResponse = await api.get(`/api/users/${user.id}/requests/sent`);
      const alreadySent = {};
      for (const req of sentResponse.data) {
        if (req.status === 'pending') {
          alreadySent[req.to_user_id] = 'sent';
        }
      }
      setRequestStatus(alreadySent);

    } catch (err) {
      console.log('Could not load matches:', err);
      setError('Could not load matches. Make sure the backend is running.');
    }
    setLoading(false);
  }

  // Send a study request to a matched student
  async function handleSendRequest(toUserId, toUserName) {
    // Mark button as loading
    setRequestStatus(prev => ({ ...prev, [toUserId]: 'sending' }));

    try {
      await api.post(`/api/users/${user.id}/requests`, {
        to_user_id: toUserId,
        message: `Hi ${toUserName}, I'd love to study together since we share some classes!`
      });

      // Mark as sent so button changes to a confirmation
      setRequestStatus(prev => ({ ...prev, [toUserId]: 'sent' }));
      console.log('Study request sent to user', toUserId);

    } catch (err) {
      console.log('Request error:', err);
      const msg = err.response?.data?.error || 'Could not send request.';
      // Show the error message briefly, then reset the button
      setRequestStatus(prev => ({ ...prev, [toUserId]: msg }));
    }
  }

  function formatTime(timeStr) {
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }

  // Pick a color for the percentage bar based on how high it is
  // Green for high match, orange for medium, gray for low
  function getBarColor(percentage) {
    if (percentage >= 75) return '#2a7d4f';  // Dark green
    if (percentage >= 50) return '#E5751F';  // VT orange
    if (percentage >= 25) return '#861F41';  // VT maroon
    return '#aaa';                            // Gray for low match
  }

  return (
    <div>
      <div className="header">
        <h1>HokieStudy</h1>
        <div className="header-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/courses">My Courses</Link>
          <Link to="/availability">My Availability</Link>
          <Link to="/requests">My Requests</Link>
        </div>
      </div>

      <div className="page-container">
        <div className="card">
          <h2>Study Partner Matches</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Students below share at least one course with you, sorted by match percentage.
          </p>

          {loading && (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              Finding your study partners...
            </p>
          )}

          {error && <div className="error-message">{error}</div>}

          {!loading && matches.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
              <p>No matches found yet!</p>
              <p style={{ marginTop: '10px', fontSize: '14px' }}>
                Add your courses in{' '}
                <Link to="/courses" style={{ color: '#861F41' }}>My Courses</Link>{' '}
                to find study partners.
              </p>
            </div>
          )}

          {matches.map((match, index) => {
            const status = requestStatus[match.user.id];
            const barColor = getBarColor(match.matchPercentage);

            return (
              <div key={index} className="match-card">

                {/* Top row: name + request button side by side */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3>{match.user.name}</h3>
                    <p style={{ color: '#888', fontSize: '14px' }}>
                      {match.user.year !== 'Not specified' ? match.user.year + ' at VT' : 'VT Student'}
                    </p>
                  </div>

                  {/* Request to Study button */}
                  {status === 'sent' ? (
                    <span style={{
                      color: '#2a7d4f',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      padding: '8px 12px',
                      backgroundColor: '#d4edda',
                      borderRadius: '5px'
                    }}>
                      Request Sent!
                    </span>
                  ) : status === 'sending' ? (
                    <span style={{ color: '#888', fontSize: '14px', padding: '8px' }}>
                      Sending...
                    </span>
                  ) : (
                    <button
                      className="btn btn-orange btn-small"
                      onClick={() => handleSendRequest(match.user.id, match.user.name)}
                      title={typeof status === 'string' && status !== 'sending' ? status : ''}
                    >
                      {typeof status === 'string' && status !== 'sending' && status !== 'sent'
                        ? 'Try Again'
                        : 'Request to Study'}
                    </button>
                  )}
                </div>

                {/* Match percentage bar */}
                <div style={{ marginTop: '12px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#555', fontWeight: 'bold' }}>
                      Match Score
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: barColor }}>
                      {match.matchPercentage}%
                    </span>
                  </div>
                  {/* Outer gray track */}
                  <div style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    {/* Inner colored fill — width is the percentage */}
                    <div style={{
                      width: `${match.matchPercentage}%`,
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: '5px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Shares {match.sharedCourseCount} of your {match.myTotalCourses} course{match.myTotalCourses !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Shared courses */}
                <div className="shared-courses">
                  <strong>Shared courses: </strong>
                  {match.sharedCourses.map(c => c.course_code).join(', ')}
                </div>

                {/* Overlapping availability */}
                {match.overlappingAvailability.length > 0 && (
                  <div className="overlap-info">
                    <strong>Could study together: </strong>
                    {match.overlappingAvailability.map((slot, i) => (
                      <span key={i}>
                        {i > 0 && ' | '}
                        {slot.day} at {formatTime(slot.time)}
                      </span>
                    ))}
                  </div>
                )}

                {match.overlappingAvailability.length === 0 && (
                  <p style={{ color: '#999', fontSize: '13px', marginTop: '6px' }}>
                    No overlapping availability yet
                  </p>
                )}

                {/* Show error message under the card if request failed */}
                {typeof status === 'string' && status !== 'sending' && status !== 'sent' && (
                  <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '6px' }}>{status}</p>
                )}

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}

export default Matches;
