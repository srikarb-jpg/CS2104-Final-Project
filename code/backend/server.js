// server.js - The main Express server for HokieStudy
//
// This is the entry point for our backend application.
// It sets up the Express web server, connects all our routes,
// and starts listening for requests on port 5000.
//
// To start the server: node server.js
// To start with auto-reload: npm run dev

// IMPORTANT: This must be the VERY FIRST LINE
// It loads the variables from our .env file (like JWT_SECRET and PORT)
// If this runs after anything else, those variables won't be set yet
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import all our route files
// Each file handles a different part of the app
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const availabilityRoutes = require('./routes/availability');
const matchRoutes = require('./routes/matches');
const requestRoutes = require('./routes/requests');

// Create the Express app
// Think of this like creating a new web server object
const app = express();

// The port our server runs on (5000 from .env file, or 5000 as default)
const PORT = process.env.PORT || 5000;

// =====================================================
// MIDDLEWARE
// These run on EVERY request before it reaches any route
// =====================================================

// CORS (Cross-Origin Resource Sharing)
// Our React frontend runs on localhost:3000, but the backend is on localhost:5000
// Browsers normally block requests between different ports for security reasons
// This tells the browser: "It's okay for localhost:3000 to talk to this server"
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// This middleware reads the JSON body of POST/PUT requests
// Without it, req.body would be undefined
app.use(express.json());

// =====================================================
// ROUTES
// Each route file handles a group of related endpoints
// =====================================================

// Authentication routes: /api/auth/register and /api/auth/login
app.use('/api/auth', authRoutes);

// User profile routes: /api/users/:id
app.use('/api/users', userRoutes);

// Course search: /api/courses?search=...
app.use('/api/courses', courseRoutes);

// User courses: /api/users/:id/courses (note: same prefix as userRoutes, different paths)
app.use('/api/users', courseRoutes);

// Availability: /api/users/:id/availability
app.use('/api/users', availabilityRoutes);

// Matches: /api/users/:id/matches
app.use('/api/users', matchRoutes);

// Study requests: /api/users/:id/requests
app.use('/api/users', requestRoutes);

// =====================================================
// HEALTH CHECK
// A simple route to test if the server is running
// Visit http://localhost:5000/api/health to check
// =====================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HokieStudy backend is running! Go Hokies!' });
});

// =====================================================
// START THE SERVER
// =====================================================
// We only start listening if this file is run directly (not when imported by tests)
// module === require.main is true when you run "node server.js" directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`HokieStudy server is running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export app so tests can import it without starting the server
module.exports = app;
