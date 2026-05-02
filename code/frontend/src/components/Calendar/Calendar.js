// Calendar.js - View your study schedule and export to Google Calendar
//
// This page shows a read-only view of your weekly availability as a grid,
// and has a button to export it as a .ics file.
//
// A .ics file is the standard calendar format used by Google Calendar,
// Apple Calendar, Outlook, and most other calendar apps.
// The user downloads the .ics file and then imports it into Google Calendar.
//
// The .ics file is generated entirely in the browser - no extra server call needed!

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

// Same constants as Availability.js - needed to draw the same grid
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

// Maps day names to the 2-letter code used in .ics files (RFC 5545 standard)
const DAY_TO_ICS = {
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
  Saturday: 'SA',
  Sunday: 'SU'
};

function Calendar() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // The availability slots loaded from the backend
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportMessage, setExportMessage] = useState('');

  // Load the user's saved availability when the page opens
  useEffect(() => {
    loadAvailability();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAvailability() {
    try {
      const response = await api.get(`/api/users/${user.id}/availability`);
      setSlots(response.data);
      console.log('Calendar loaded', response.data.length, 'slots');
    } catch (err) {
      console.log('Could not load availability for calendar:', err);
    }
    setLoading(false);
  }

  // Check if a specific day+time cell is in our saved slots
  // This is used to color in the grid cells
  function isSlotSelected(day, time) {
    return slots.some(slot => slot.day_of_week === day && slot.start_time === time);
  }

  // Format "08:00" as "8 AM" for display
  function formatTime(timeStr) {
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }

  // Generate and download a .ics file for Google Calendar
  function handleExportICS() {
    if (slots.length === 0) {
      setExportMessage('No availability to export! Add some time slots first.');
      return;
    }

    // Build the .ics file content as a string
    // .ics is the iCalendar format (RFC 5545) used by all major calendar apps
    // IMPORTANT: iCal requires \r\n (carriage return + newline) as line endings
    // This is different from normal text files which just use \n

    let icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HokieStudy//VT Study App//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:HokieStudy Availability',
      'X-WR-TIMEZONE:America/New_York'
    ];

    // Each availability slot becomes a recurring weekly event in the calendar
    slots.forEach((slot, index) => {
      // Calculate start and end hours as numbers
      const startHour = parseInt(slot.start_time.split(':')[0]);
      const endHour = startHour + 1; // Each slot is 1 hour long

      // Format times as HHMMSS (iCal format requires this)
      const startStr = String(startHour).padStart(2, '0') + '0000';
      const endStr = String(endHour).padStart(2, '0') + '0000';

      // We use a fixed "anchor" date (Monday 2025-01-06) as the starting point
      // The RRULE (Recurrence Rule) then makes this repeat weekly on the right day
      // This means the event shows up every week in the user's calendar
      const icsDay = DAY_TO_ICS[slot.day_of_week];

      icsLines = icsLines.concat([
        'BEGIN:VEVENT',
        `UID:hokiestudy-${user.id}-${index}@vt.edu`,           // Unique ID for this event
        `SUMMARY:Study Time (HokieStudy)`,                       // Event title
        `DESCRIPTION:Study availability for ${user.name || 'VT Student'}`,
        `DTSTART;TZID=America/New_York:20250106T${startStr}`,   // Start date/time
        `DTEND;TZID=America/New_York:20250106T${endStr}`,       // End date/time
        `RRULE:FREQ=WEEKLY;BYDAY=${icsDay}`,                    // Repeat weekly on this day
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      ]);
    });

    icsLines.push('END:VCALENDAR');

    // Join with \r\n (required by iCal spec, not just \n)
    const icsContent = icsLines.join('\r\n');

    // Create a downloadable file in the browser without needing a server
    // Blob is like a file object in memory
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

    // URL.createObjectURL() creates a temporary URL pointing to our blob
    const url = URL.createObjectURL(blob);

    // Create a hidden link element and click it to trigger the download
    // This is a common JavaScript trick for downloading files from the browser
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hokiestudy-availability.ics'; // The filename that gets downloaded

    // The link needs to be on the page to click it (at least in some browsers)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the temporary URL to free memory
    URL.revokeObjectURL(url);

    setExportMessage(`Exported ${slots.length} events! Import the .ics file into Google Calendar.`);
    console.log('Calendar exported:', slots.length, 'events');
  }

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h1>HokieStudy</h1>
        <div className="header-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/availability">Edit Availability</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px' }}>
        <h2>My Study Calendar</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          This shows your weekly study availability.
          Use the <strong>Export</strong> button to download a .ics file,
          then import it into Google Calendar (or any other calendar app).
        </p>

        {loading && (
          <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
            Loading your calendar...
          </p>
        )}

        {!loading && slots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
            <p>No availability set yet.</p>
            <p style={{ marginTop: '10px' }}>
              Go to{' '}
              <Link to="/availability" style={{ color: '#861F41' }}>My Availability</Link>{' '}
              to mark when you're free to study.
            </p>
          </div>
        )}

        {/* Read-only availability grid */}
        {!loading && slots.length > 0 && (
          <>
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table className="availability-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    {DAYS.map(day => (
                      <th key={day}>{day.substring(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIMES.map((time, timeIndex) => (
                    <tr key={time}>
                      <td>{TIME_LABELS[timeIndex]}</td>
                      {DAYS.map(day => (
                        <td
                          key={day}
                          className={`time-slot ${isSlotSelected(day, time) ? 'selected' : ''}`}
                          title={isSlotSelected(day, time) ? `${day} ${TIME_LABELS[timeIndex]} - Available` : ''}
                          style={{ cursor: 'default' }} /* Read-only - not clickable */
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ color: '#666', marginBottom: '15px' }}>
              {slots.length} time slot{slots.length !== 1 ? 's' : ''} marked as available
            </p>
          </>
        )}

        {/* Export button */}
        <button className="btn btn-orange" onClick={handleExportICS} disabled={loading}>
          Export to Google Calendar (.ics)
        </button>

        {/* Instructions for importing to Google Calendar */}
        {slots.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f8f8',
            borderRadius: '5px',
            fontSize: '14px',
            color: '#555'
          }}>
            <strong>How to import into Google Calendar:</strong>
            <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Click "Export to Google Calendar (.ics)" above to download the file</li>
              <li>Open <strong>Google Calendar</strong> in your browser</li>
              <li>Click the <strong>Settings gear</strong> (top right)</li>
              <li>Go to <strong>Settings &gt; Import &amp; Export</strong></li>
              <li>Click <strong>Select file from your computer</strong> and choose the .ics file</li>
              <li>Click <strong>Import</strong></li>
            </ol>
          </div>
        )}

        {/* Success message after export */}
        {exportMessage && (
          <div className="success-message" style={{ marginTop: '15px' }}>
            {exportMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;
