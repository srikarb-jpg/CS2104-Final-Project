// users.js - Routes for viewing and editing user profiles
//
// Routes in this file:
//   GET /api/users/:id  - Get a user's profile information
//   PUT /api/users/:id  - Update a user's profile information
//
// All routes here require the user to be logged in (verifyToken middleware)
// The :id in the URL is a parameter - for example /api/users/3 would have id = "3"

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB, writeDB } = require('../database/db');

// =====================================================
// GET /api/users/:id
// Returns a user's profile info
// =====================================================
router.get('/:id', verifyToken, (req, res) => {
  // req.params.id is the :id from the URL - it comes in as a string, so we convert to number
  const userId = parseInt(req.params.id);

  // Security check: users can only view their own profile
  // req.user.id comes from the JWT token (set by verifyToken middleware)
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only view your own profile.' });
  }

  const data = readDB();

  // Find the user with the matching ID
  const user = data.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Send back the user info, but NOT the password
  // We use object destructuring to exclude the password field
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// =====================================================
// PUT /api/users/:id
// Updates a user's profile (name, year, age)
// =====================================================
router.put('/:id', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  // Security check: users can only edit their own profile
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only edit your own profile.' });
  }

  const { name, year, age } = req.body;

  const data = readDB();

  // Find the index of this user in the array
  // findIndex() is like find() but returns the position number instead of the object
  const userIndex = data.users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Update only the fields that were provided
  // We keep the existing values for any fields not in the request
  if (name) data.users[userIndex].name = name;
  if (year) data.users[userIndex].year = year;
  if (age) data.users[userIndex].age = parseInt(age);

  // Save the updated data back to the file
  writeDB(data);

  console.log('Profile updated for user:', userId);
  res.json({ message: 'Profile updated successfully!' });
});

module.exports = router;
