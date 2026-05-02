// availability.js - Routes for managing a user's weekly study availability
//
// Routes in this file:
//   POST /api/users/:id/availability - Save availability (replaces any existing slots)
//   GET  /api/users/:id/availability - Get a user's availability slots
//
// The availability is stored as time slots, like:
//   { day_of_week: "Monday", start_time: "08:00", end_time: "10:00" }
// The user can mark multiple 2-hour blocks when they're free to study.

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB, writeDB } = require('../database/db');

// =====================================================
// POST /api/users/:id/availability
// Saves the user's weekly availability
// This replaces ALL existing availability with the new data
// =====================================================
router.post('/:id/availability', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  // Security: users can only update their own availability
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only update your own availability.' });
  }

  // slots is an array of time blocks the user selected, for example:
  // [ { day_of_week: "Monday", start_time: "08:00", end_time: "10:00" }, ... ]
  const { slots } = req.body;

  // Make sure slots is actually an array
  if (!Array.isArray(slots)) {
    return res.status(400).json({ error: 'slots must be an array of time blocks.' });
  }

  const data = readDB();

  // Remove ALL existing availability for this user
  // This is like DELETE FROM availability WHERE user_id = ?
  // .filter() returns a new array with only items that DON'T belong to this user
  data.availability = data.availability.filter(a => a.user_id !== userId);

  // Add the new slots
  // We loop through each slot the user sent and add it to our data
  for (const slot of slots) {
    const newSlot = {
      id: data.nextIds.availability,
      user_id: userId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time
    };
    data.availability.push(newSlot);
    data.nextIds.availability += 1;
  }

  // Save everything back to the file
  // By deleting and re-inserting, we avoid ending up with half-saved data
  writeDB(data);

  console.log(`Saved ${slots.length} availability slots for user ${userId}`);
  res.json({ message: 'Availability saved!' });
});

// =====================================================
// GET /api/users/:id/availability
// Returns all availability slots for a user
// =====================================================
router.get('/:id/availability', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  const data = readDB();

  // Get all slots that belong to this user
  const userAvailability = data.availability.filter(a => a.user_id === userId);

  res.json(userAvailability);
});

module.exports = router;
