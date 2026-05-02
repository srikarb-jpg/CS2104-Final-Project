const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../database/db');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, year, age } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const data = readDB();

  const existingUser = data.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with that email already exists.' });
  }

  // never store plain text passwords
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    id: data.nextIds.users,
    name,
    email,
    password: hashedPassword,
    year: year || null,
    age: age ? parseInt(age) : null
  };

  data.users.push(newUser);
  data.nextIds.users += 1;
  writeDB(data);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('New user registered:', email);
  res.status(201).json({
    message: 'Account created! Welcome to HokieStudy!',
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, year: newUser.year, age: newUser.age }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const data = readDB();
  const user = data.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('User logged in:', email);
  res.json({
    message: 'Logged in!',
    token,
    user: { id: user.id, name: user.name, email: user.email, year: user.year, age: user.age }
  });
});

module.exports = router;
