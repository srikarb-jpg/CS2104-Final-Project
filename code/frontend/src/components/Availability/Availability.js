import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

const TIME_LABELS = [
  '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
  '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'
];

function Availability() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // use a Set of "Day-HH:MM" strings to track selected cells
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAvailability() {
    try {
      const response = await api.get(`/api/users/${user.id}/availability`);
      const slotSet = new Set(response.data.map(s => `${s.day_of_week}-${s.start_time}`));
      setSelectedSlots(slotSet);
      console.log('Loaded', response.data.length, 'slots');
    } catch (err) {
      console.log('Could not load availability:', err);
    }
  }

  function toggleSlot(day, time) {
    const key = `${day}-${time}`;
    setSelectedSlots(prevSet => {
      const newSet = new Set(prevSet);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  async function handleSave() {
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const slots = [];
      for (const slotKey of selectedSlots) {
        const [day, startTime] = slotKey.split('-');
        const startHour = parseInt(startTime.split(':')[0]);
        const endTime = `${String(startHour + 1).padStart(2, '0')}:00`;
        slots.push({ day_of_week: day, start_time: startTime, end_time: endTime });
      }

      await api.post(`/api/users/${user.id}/availability`, { slots });
      setMessage(`Saved! ${slots.length} time slots marked as available.`);
      console.log('Saved', slots.length, 'slots');
    } catch (err) {
      console.log('Save error:', err);
      setError('Could not save. Please try again.');
    }

    setLoading(false);
  }

  function handleClearAll() {
    setSelectedSlots(new Set());
    setMessage('');
  }

  return (
    <div>
      <div className="header">
        <h1>HokieStudy</h1>
        <div className="header-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/matches">Find Partners</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px' }}>
        <h2>My Weekly Study Availability</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Click on cells to mark when you're free to study.
          <strong style={{ color: '#861F41' }}> Maroon = available.</strong>
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="availability-table">
            <thead>
              <tr>
                <th style={{ minWidth: '70px' }}>Time</th>
                {DAYS.map(day => (
                  <th key={day} style={{ minWidth: '80px' }}>{day.substring(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIMES.map((time, timeIndex) => (
                <tr key={time}>
                  <td>{TIME_LABELS[timeIndex]}</td>
                  {DAYS.map(day => {
                    const slotKey = `${day}-${time}`;
                    const isSelected = selectedSlots.has(slotKey);
                    return (
                      <td
                        key={day}
                        className={`time-slot ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleSlot(day, time)}
                        title={`${day} ${TIME_LABELS[timeIndex]}`}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: '12px', color: '#666' }}>
          {selectedSlots.size} time slot{selectedSlots.size !== 1 ? 's' : ''} selected
        </p>

        {message && <div className="success-message" style={{ marginTop: '12px' }}>{message}</div>}
        {error && <div className="error-message" style={{ marginTop: '12px' }}>{error}</div>}

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Availability'}
          </button>
          <button
            className="btn"
            style={{ backgroundColor: '#ccc', color: '#333' }}
            onClick={handleClearAll}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default Availability;
