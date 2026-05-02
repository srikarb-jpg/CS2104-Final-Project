// Availability.js - Weekly study availability grid
//
// This page shows a grid (table) with days of the week across the top
// and time slots down the side. Students click cells to mark when they're
// free to study. Selected cells turn VT maroon.
//
// The data is saved to the backend so the matching system can find students
// with overlapping free time.
//
// This is the most complex component because of the 2D grid state management.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

// The 7 days of the week (column headers)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// The 15 time slots (row labels) - stored in 24-hour format for the backend
const TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

// Human-readable labels for the times (shown to the user)
const TIME_LABELS = [
  '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
  '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'
];

function Availability() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // selectedSlots holds a Set of strings like "Monday-08:00"
  // A Set in JavaScript is like a HashSet in Java - it stores unique values
  // We use it so that each time slot can only be selected once
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing availability when the page opens
  useEffect(() => {
    loadAvailability();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch the user's saved availability from the backend
  async function loadAvailability() {
    try {
      const response = await api.get(`/api/users/${user.id}/availability`);
      const slots = response.data;

      // Convert the array of slot objects into a Set of strings
      // e.g., [{day_of_week: "Monday", start_time: "08:00"}] becomes Set(["Monday-08:00"])
      const slotSet = new Set(slots.map(s => `${s.day_of_week}-${s.start_time}`));
      setSelectedSlots(slotSet);

      console.log('Loaded', slots.length, 'availability slots');
    } catch (err) {
      console.log('Could not load availability:', err);
    }
  }

  // Toggle a cell when the user clicks it
  // If the cell is selected, deselect it. If deselected, select it.
  function toggleSlot(day, time) {
    // The "key" for this slot is "Day-Time" e.g., "Monday-08:00"
    const key = `${day}-${time}`;

    // We need to create a NEW Set (not modify the old one) for React to detect the change
    // This is similar to creating a new ArrayList in Java instead of modifying the original
    setSelectedSlots(prevSet => {
      const newSet = new Set(prevSet); // Copy the old set

      if (newSet.has(key)) {
        newSet.delete(key); // If already selected, deselect it
      } else {
        newSet.add(key);    // If not selected, select it
      }

      return newSet; // Return the new set to update the state
    });
  }

  // Save the user's availability to the backend
  async function handleSave() {
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // Convert the Set back into an array of slot objects for the backend
      const slots = [];
      for (const slotKey of selectedSlots) {
        // Each key is like "Monday-08:00" - split it to get the parts
        const [day, startTime] = slotKey.split('-');

        // Calculate end time by adding 1 hour
        // parseInt() converts "08" to 8 so we can do math on it
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = startHour + 1;

        // padStart(2, '0') adds a leading zero if needed: 8 -> "08", 10 -> "10"
        const endTime = `${String(endHour).padStart(2, '0')}:00`;

        slots.push({
          day_of_week: day,
          start_time: startTime,
          end_time: endTime
        });
      }

      // Send all slots to the backend to save
      await api.post(`/api/users/${user.id}/availability`, { slots });

      setMessage(`Saved! You marked ${slots.length} time slots as available.`);
      console.log('Saved', slots.length, 'slots');

    } catch (err) {
      console.log('Save error:', err);
      setError('Could not save availability. Please try again.');
    }

    setLoading(false);
  }

  // Clear all selected slots
  function handleClearAll() {
    setSelectedSlots(new Set()); // Replace with empty Set
    setMessage('');
  }

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

      <div className="card" style={{ maxWidth: '900px' }}>
        <h2>My Weekly Study Availability</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Click on cells to mark when you're free to study each week.
          <strong style={{ color: '#861F41' }}> Selected cells (maroon) = available to study.</strong>
        </p>

        {/* The availability grid table */}
        {/* overflow-x: auto makes it scrollable on small screens */}
        <div style={{ overflowX: 'auto' }}>
          <table className="availability-table">
            <thead>
              <tr>
                {/* Top-left corner is empty */}
                <th style={{ minWidth: '70px' }}>Time</th>
                {/* Create a column header for each day */}
                {DAYS.map(day => (
                  <th key={day} style={{ minWidth: '80px' }}>
                    {/* Show abbreviated day names on smaller screens */}
                    {day.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Create a row for each time slot */}
              {TIMES.map((time, timeIndex) => (
                <tr key={time}>
                  {/* Time label in the first column */}
                  <td>{TIME_LABELS[timeIndex]}</td>

                  {/* Create a clickable cell for each day */}
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

        {/* Show selected count */}
        <p style={{ marginTop: '12px', color: '#666' }}>
          {selectedSlots.size} time slot{selectedSlots.size !== 1 ? 's' : ''} selected
        </p>

        {/* Status messages */}
        {message && <div className="success-message" style={{ marginTop: '12px' }}>{message}</div>}
        {error && <div className="error-message" style={{ marginTop: '12px' }}>{error}</div>}

        {/* Action buttons */}
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
