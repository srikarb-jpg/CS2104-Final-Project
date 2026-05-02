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

// day name to iCal 2-letter code
const DAY_TO_ICS = {
  Monday: 'MO', Tuesday: 'TU', Wednesday: 'WE', Thursday: 'TH',
  Friday: 'FR', Saturday: 'SA', Sunday: 'SU'
};

function Calendar() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    loadAvailability();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAvailability() {
    try {
      const response = await api.get(`/api/users/${user.id}/availability`);
      setSlots(response.data);
      console.log('Calendar loaded', response.data.length, 'slots');
    } catch (err) {
      console.log('Could not load availability:', err);
    }
    setLoading(false);
  }

  function isSlotSelected(day, time) {
    return slots.some(slot => slot.day_of_week === day && slot.start_time === time);
  }

  function handleExportICS() {
    if (slots.length === 0) {
      setExportMessage('No availability to export! Add some time slots first.');
      return;
    }

    // build iCal file content — requires \r\n line endings (RFC 5545)
    let icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HokieStudy//VT Study App//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:HokieStudy Availability',
      'X-WR-TIMEZONE:America/New_York'
    ];

    slots.forEach((slot, index) => {
      const startHour = parseInt(slot.start_time.split(':')[0]);
      const endHour = startHour + 1;
      const startStr = String(startHour).padStart(2, '0') + '0000';
      const endStr = String(endHour).padStart(2, '0') + '0000';
      const icsDay = DAY_TO_ICS[slot.day_of_week];

      icsLines = icsLines.concat([
        'BEGIN:VEVENT',
        `UID:hokiestudy-${user.id}-${index}@vt.edu`,
        `SUMMARY:Study Time (HokieStudy)`,
        `DESCRIPTION:Study availability for ${user.name || 'VT Student'}`,
        `DTSTART;TZID=America/New_York:20250106T${startStr}`,
        `DTEND;TZID=America/New_York:20250106T${endStr}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${icsDay}`,
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      ]);
    });

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // trigger download via a hidden link
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hokiestudy-availability.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportMessage(`Exported ${slots.length} events! Import the .ics file into Google Calendar.`);
    console.log('Exported', slots.length, 'events');
  }

  return (
    <div>
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
          This shows your weekly study availability. Use the <strong>Export</strong> button
          to download a .ics file, then import it into Google Calendar.
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

        {!loading && slots.length > 0 && (
          <>
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table className="availability-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    {DAYS.map(day => <th key={day}>{day.substring(0, 3)}</th>)}
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
                          style={{ cursor: 'default' }}
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

        <button className="btn btn-orange" onClick={handleExportICS} disabled={loading}>
          Export to Google Calendar (.ics)
        </button>

        {slots.length > 0 && (
          <div style={{
            marginTop: '20px', padding: '15px', backgroundColor: '#f8f8f8',
            borderRadius: '5px', fontSize: '14px', color: '#555'
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
