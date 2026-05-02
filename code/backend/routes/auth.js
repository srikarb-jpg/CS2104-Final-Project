// auth.js - Routes for registering and logging in
//
// This file handles two things:
//   POST /api/auth/register - Create a new account
//   POST /api/auth/login    - Log into an existing account
//
// After successful register or login, we send back a JWT token.
// The frontend saves this token and sends it with future requests.

const express = require('express');
const router = express.Router(); // Router is like a mini Express app for a group of routes
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../database/db');

// =====================================================
// POST /api/auth/register
// Creates a new user account
// =====================================================
router.post('/register', (req, res) => {
  // req.body contains the data the user sent (name, email, password, etc.)
  const { name, email, password, year, age } = req.body;

  // Check that the required fields are present
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  // Read the current data from our JSON file
  const data = readDB();

  // Check if someone already registered with this email
  // Array.find() is like a SQL WHERE clause - it searches through the array
  const existingUser = data.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with that email already exists.' });
  }

  // IMPORTANT: We never store the real password - only a "hash" of it.
  // bcrypt.hashSync() scrambles the password using a one-way algorithm.
  // The "10" is the "salt rounds" - how many times it scrambles it (more = more secure but slower)
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create the new user object
  // We use nextIds.users as the ID, then increment it for the next user
  const newUser = {
    id: data.nextIds.users,
    name: name,
    email: email,
    password: hashedPassword,       // Store the hashed version, not the real password!
    year: year || null,             // year might not be provided, so default to null
    age: age ? parseInt(age) : null // Convert age to a number if it was given
  };

  // Add the new user to our users array and save
  data.users.push(newUser);
  data.nextIds.users += 1;
  writeDB(data);

  // Create a JWT token for the new user so they're logged in right away
  // jwt.sign() creates a token with the user's info + our secret key
  // expiresIn: '7d' means the token expires after 7 days
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('New user registered:', email);

  // Send back the token and user info (without the password!)
  res.status(201).json({
    message: 'Account created successfully! Welcome to HokieStudy!',
    token: token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, year: newUser.year, age: newUser.age }
  });
});

// =====================================================
// POST /api/auth/login
// Logs into an existing account
// =====================================================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Make sure both fields are provided
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const data = readDB();

  // Find the user by their email address
  const user = data.users.find(u => u.email === email);

  // If no user found with that email, don't tell them which part is wrong
  // (security best practice - don't reveal whether email or password was wrong)
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Compare the password they typed with the hashed version we stored
  // bcrypt.compareSync() rehashes the plain text and checks if it matches
  const passwordMatch = bcrypt.compareSync(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Password matched! Create a new token for this session
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('User logged in:', email);

  // Send back the token and user info (no password in the response!)
  res.json({
    message: 'Logged in successfully!',
    token: token,
    user: { id: user.id, name: user.name, email: user.email, year: user.year, age: user.age }
  });
});

module.exports = router;
