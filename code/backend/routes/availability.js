const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB, writeDB } = require('../database/db');

// POST /api/users/:id/availability  — replaces all existing slots with new ones
router.post('/:id/availability', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only update your own availability.' });
  }

  const { slots } = req.body;

  if (!Array.isArray(slots)) {
    return res.status(400).json({ error: 'slots must be an array.' });
  }

  const data = readDB();

  // delete existing slots for this user, then re-add the new ones
  data.availability = data.availability.filter(a => a.user_id !== userId);

  for (const slot of slots) {
    data.availability.push({
      id: data.nextIds.availability,
      user_id: userId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time
    });
    data.nextIds.availability += 1;
  }

  writeDB(data);
  console.log(`Saved ${slots.length} availability slots for user ${userId}`);
  res.json({ message: 'Availability saved!' });
});

// GET /api/users/:id/availability
router.get('/:id/availability', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const data = readDB();
  const userAvailability = data.availability.filter(a => a.user_id === userId);
  res.json(userAvailability);
});

module.exports = router;
