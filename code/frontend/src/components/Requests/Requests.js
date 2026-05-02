// Requests.js - View and respond to study partner requests
//
// This page has two sections:
//   1. INCOMING requests - people who want to study with you (Accept / Decline)
//   2. SENT requests     - requests you've sent and their current status

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function Requests() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Incoming requests (sent TO this user)
  const [incoming, setIncoming] = useState([]);

  // Requests this user sent OUT
  const [sent, setSent] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Load both lists when the page opens
  useEffect(() => {
    loadRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRequests() {
    setLoading(true);
    try {
      // Fetch incoming requests
      const incomingRes = await api.get(`/api/users/${user.id}/requests`);
      setIncoming(incomingRes.data);

      // Fetch sent requests
      const sentRes = await api.get(`/api/users/${user.id}/requests/sent`);
      setSent(sentRes.data);

      console.log('Loaded', incomingRes.data.length, 'incoming,', sentRes.data.length, 'sent');
    } catch (err) {
      console.log('Could not load requests:', err);
    }
    setLoading(false);
  }

  // Accept or decline an incoming request
  async function handleRespond(requestId, action) {
    try {
      await api.put(`/api/users/${user.id}/requests/${requestId}`, { action });

      const word = action === 'accept' ? 'Accepted' : 'Declined';
      setMessage(`${word}! Refreshing...`);

      // Reload the lists to show updated status
      loadRequests();

    } catch (err) {
      console.log('Error responding to request:', err);
      setMessage('Something went wrong. Please try again.');
    }
  }

  // Format a date string like "2025-01-01T12:00:00.000Z" into "Jan 1, 2025"
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Return a colored badge based on request status
  function StatusBadge({ status }) {
    const styles = {
      pending:  { backgroundColor: '#fff3cd', color: '#856404', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' },
      accepted: { backgroundColor: '#d4edda', color: '#155724', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' },
      declined: { backgroundColor: '#f8d7da', color: '#721c24', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }
    };
    return <span style={styles[status] || styles.pending}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  }

  // Count how many incoming requests are still pending (for the heading badge)
  const pendingCount = incoming.filter(r => r.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h1>HokieStudy</h1>
        <div className="header-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/matches">Find Partners</Link>
        </div>
      </div>

      <div className="page-container">

        {loading && (
          <div className="card">
            <p style={{ color: '#888', textAlign: 'center' }}>Loading requests...</p>
          </div>
        )}

        {message && (
          <div className="success-message" style={{ maxWidth: '800px', margin: '0 auto 10px' }}>
            {message}
          </div>
        )}

        {/* ---- INCOMING REQUESTS ---- */}
        <div className="card">
          <h2>
            Incoming Requests
            {/* Show a red badge with pending count if there are any */}
            {pendingCount > 0 && (
              <span style={{
                marginLeft: '10px',
                backgroundColor: '#861F41',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 10px',
                fontSize: '15px'
              }}>
                {pendingCount} new
              </span>
            )}
          </h2>

          {!loading && incoming.length === 0 && (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              No one has sent you a study request yet.
            </p>
          )}

          {incoming.map(req => (
            <div key={req.id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '12px',
              backgroundColor: req.status === 'pending' ? '#fffdf0' : '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{req.from_user.name}</strong>
                  <span style={{ color: '#888', fontSize: '13px', marginLeft: '10px' }}>
                    {req.from_user.year || 'VT Student'}
                  </span>
                </div>
                <StatusBadge status={req.status} />
              </div>

              {/* Message from the sender */}
              {req.message && (
                <p style={{
                  margin: '10px 0',
                  padding: '10px',
                  backgroundColor: '#f8f8f8',
                  borderRadius: '5px',
                  fontSize: '14px',
                  color: '#444',
                  fontStyle: 'italic'
                }}>
                  "{req.message}"
                </p>
              )}

              <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '10px' }}>
                Received {formatDate(req.created_at)}
              </p>

              {/* Accept / Decline buttons only show for pending requests */}
              {req.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => handleRespond(req.id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleRespond(req.id, 'decline')}
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ---- SENT REQUESTS ---- */}
        <div className="card">
          <h2>Requests I've Sent</h2>

          {!loading && sent.length === 0 && (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              You haven't sent any study requests yet.{' '}
              <Link to="/matches" style={{ color: '#861F41' }}>Find study partners</Link> to get started.
            </p>
          )}

          {sent.map(req => (
            <div key={req.id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '12px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>To: {req.to_user.name}</strong>
                  <span style={{ color: '#888', fontSize: '13px', marginLeft: '10px' }}>
                    {req.to_user.year || 'VT Student'}
                  </span>
                </div>
                <StatusBadge status={req.status} />
              </div>

              {req.message && (
                <p style={{
                  margin: '10px 0 5px',
                  fontSize: '14px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  "{req.message}"
                </p>
              )}

              <p style={{ color: '#aaa', fontSize: '12px' }}>
                Sent {formatDate(req.created_at)}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Requests;
