// App.js - The main app file that sets up page routing
//
// React Router lets us have multiple "pages" in a single-page React app.
// Instead of loading a new HTML file, it swaps out which component is shown.
//
// Routes we have:
//   /login       - Login page (public)
//   /register    - Registration page (public)
//   /dashboard   - Home page (requires login)
//   /courses     - Course management (requires login)
//   /availability - Availability grid (requires login)
//   /matches     - Study partner matches (requires login)
//   /requests    - Study partner requests inbox (requires login)
//   /calendar    - Calendar view + export (requires login)
//   /profile     - Edit profile (requires login)

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import all our page components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile';
import CourseInput from './components/Courses/CourseInput';
import Availability from './components/Availability/Availability';
import Matches from './components/Matches/Matches';
import Requests from './components/Requests/Requests';
import Calendar from './components/Calendar/Calendar';

// PrivateRoute - protects pages that require login
// If the user is not logged in (no token), redirect them to /login
// This is like an authentication guard in Java Spring Security
function PrivateRoute({ children }) {
  // Check localStorage for a saved token
  const token = localStorage.getItem('token');

  if (!token) {
    // No token = not logged in → send to login page
    // <Navigate> is React Router's redirect component
    return <Navigate to="/login" replace />;
  }

  // Has a token = logged in → show the actual page
  // {children} renders whatever component was wrapped by PrivateRoute
  return children;
}

// The main App component sets up all the routes
function App() {
  return (
    // BrowserRouter enables URL-based navigation (like http://localhost:3000/dashboard)
    <BrowserRouter>
      {/* Routes is a container that only renders the first matching Route */}
      <Routes>

        {/* Public routes - anyone can visit these without being logged in */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - user must be logged in */}
        {/* Each is wrapped in PrivateRoute which checks for a token */}
        <Route
          path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />
        <Route
          path="/profile"
          element={<PrivateRoute><Profile /></PrivateRoute>}
        />
        <Route
          path="/courses"
          element={<PrivateRoute><CourseInput /></PrivateRoute>}
        />
        <Route
          path="/availability"
          element={<PrivateRoute><Availability /></PrivateRoute>}
        />
        <Route
          path="/matches"
          element={<PrivateRoute><Matches /></PrivateRoute>}
        />
        <Route
          path="/requests"
          element={<PrivateRoute><Requests /></PrivateRoute>}
        />
        <Route
          path="/calendar"
          element={<PrivateRoute><Calendar /></PrivateRoute>}
        />

        {/* If someone visits just "/" (root URL), send them to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
