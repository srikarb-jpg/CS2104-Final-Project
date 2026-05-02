// courses.js - Routes for searching courses and managing a user's course list
//
// Routes in this file:
//   GET    /api/courses                       - Search for VT courses by name or code
//   GET    /api/users/:id/courses             - Get all courses a user is enrolled in
//   POST   /api/users/:id/courses             - Add a course to a user's list
//   DELETE /api/users/:id/courses/:courseId   - Remove a course from a user's list

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB, writeDB } = require('../database/db');

// =====================================================
// GET /api/courses?search=cs
// Searches the VT course catalog
// The ?search= part is a "query parameter" - optional filter text
// =====================================================
router.get('/', (req, res) => {
  // req.query.search gets the value after ?search= in the URL
  // If no search term provided, default to empty string (show all courses)
  const searchTerm = (req.query.search || '').toLowerCase();

  const data = readDB();

  // Filter courses where the code OR name contains the search term
  // .toLowerCase() makes the search case-insensitive (so "cs" finds "CS 2104")
  // .includes() checks if the string contains our search term
  const results = data.courses.filter(course => {
    const codeMatch = course.course_code.toLowerCase().includes(searchTerm);
    const nameMatch = course.course_name.toLowerCase().includes(searchTerm);
    return codeMatch || nameMatch;
  });

  // Only return the first 20 results to keep the response small
  res.json(results.slice(0, 20));
});

// =====================================================
// GET /api/users/:id/courses
// Gets all courses a specific user is enrolled in
// =====================================================
router.get('/:id/courses', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  const data = readDB();

  // Find all entries in user_courses for this user
  // This is like a SQL JOIN between user_courses and courses tables
  const userCourseEntries = data.user_courses.filter(uc => uc.user_id === userId);

  // For each entry, look up the full course details
  // .map() transforms each item in the array into something new
  const userCourses = userCourseEntries.map(uc => {
    // Find the matching course by ID
    const course = data.courses.find(c => c.id === uc.course_id);
    return {
      id: uc.id,              // The user_course entry ID (for deletion)
      course_id: uc.course_id,
      professor: uc.professor,
      section: uc.section,
      course_code: course ? course.course_code : 'Unknown',
      course_name: course ? course.course_name : 'Unknown Course',
      department: course ? course.department : '',
      credits: course ? course.credits : 0
    };
  });

  res.json(userCourses);
});

// =====================================================
// POST /api/users/:id/courses
// Adds a course to a user's enrolled list
// =====================================================
router.post('/:id/courses', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  // Security: users can only add courses to their own profile
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only add courses to your own profile.' });
  }

  const { course_id, professor, section } = req.body;

  // Make sure course_id was provided
  if (!course_id) {
    return res.status(400).json({ error: 'course_id is required.' });
  }

  const data = readDB();

  // Check that the course actually exists in our course list
  const courseExists = data.courses.find(c => c.id === parseInt(course_id));
  if (!courseExists) {
    return res.status(404).json({ error: 'That course was not found.' });
  }

  // Check if user already has this course added
  const alreadyAdded = data.user_courses.find(
    uc => uc.user_id === userId && uc.course_id === parseInt(course_id)
  );
  if (alreadyAdded) {
    return res.status(400).json({ error: 'You already have that course in your list.' });
  }

  // Create the new user_course entry
  const newEntry = {
    id: data.nextIds.user_courses,
    user_id: userId,
    course_id: parseInt(course_id),
    professor: professor || '',
    section: section || ''
  };

  // Add it to the array and save
  data.user_courses.push(newEntry);
  data.nextIds.user_courses += 1;
  writeDB(data);

  console.log(`User ${userId} added course ${course_id}`);
  res.status(201).json({ message: 'Course added!', entry: newEntry });
});

// =====================================================
// DELETE /api/users/:id/courses/:courseId
// Removes a course from a user's list
// courseId here is the user_courses entry ID (not the course ID)
// =====================================================
router.delete('/:id/courses/:entryId', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const entryId = parseInt(req.params.entryId);

  // Security: users can only remove their own courses
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only remove courses from your own profile.' });
  }

  const data = readDB();

  // Find the entry we want to delete
  const entryIndex = data.user_courses.findIndex(
    uc => uc.id === entryId && uc.user_id === userId
  );

  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Course entry not found.' });
  }

  // .splice(index, 1) removes 1 item at that index - like deleting a row from a table
  data.user_courses.splice(entryIndex, 1);
  writeDB(data);

  console.log(`User ${userId} removed course entry ${entryId}`);
  res.json({ message: 'Course removed!' });
});

module.exports = router;
