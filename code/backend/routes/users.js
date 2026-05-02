const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB, writeDB } = require('../database/db');

// GET /api/users/:id
router.get('/:id', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only view your own profile.' });
  }

  const data = readDB();
  const user = data.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // send back user info but not the password
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// PUT /api/users/:id
router.put('/:id', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only edit your own profile.' });
  }

  const { name, year, age } = req.body;
  const data = readDB();
  const userIndex = data.users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (name) data.users[userIndex].name = name;
  if (year) data.users[userIndex].year = year;
  if (age) data.users[userIndex].age = parseInt(age);

  writeDB(data);
  console.log('Profile updated for user:', userId);
  res.json({ message: 'Profile updated!' });
});

module.exports = router;
