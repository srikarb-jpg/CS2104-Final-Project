const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB, writeDB } = require('../database/db');

// GET /api/courses?search=cs  — search the VT course catalog
router.get('/', (req, res) => {
  const searchTerm = (req.query.search || '').toLowerCase();
  const data = readDB();

  const results = data.courses.filter(course => {
    return course.course_code.toLowerCase().includes(searchTerm) ||
           course.course_name.toLowerCase().includes(searchTerm);
  });

  res.json(results.slice(0, 20));
});

// GET /api/users/:id/courses
router.get('/:id/courses', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const data = readDB();

  const userCourseEntries = data.user_courses.filter(uc => uc.user_id === userId);

  const userCourses = userCourseEntries.map(uc => {
    const course = data.courses.find(c => c.id === uc.course_id);
    return {
      id: uc.id,
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

// POST /api/users/:id/courses
router.post('/:id/courses', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only add courses to your own profile.' });
  }

  const { course_id, professor, section } = req.body;

  if (!course_id) {
    return res.status(400).json({ error: 'course_id is required.' });
  }

  const data = readDB();

  const courseExists = data.courses.find(c => c.id === parseInt(course_id));
  if (!courseExists) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  const alreadyAdded = data.user_courses.find(
    uc => uc.user_id === userId && uc.course_id === parseInt(course_id)
  );
  if (alreadyAdded) {
    return res.status(400).json({ error: 'You already have that course in your list.' });
  }

  const newEntry = {
    id: data.nextIds.user_courses,
    user_id: userId,
    course_id: parseInt(course_id),
    professor: professor || '',
    section: section || ''
  };

  data.user_courses.push(newEntry);
  data.nextIds.user_courses += 1;
  writeDB(data);

  console.log(`User ${userId} added course ${course_id}`);
  res.status(201).json({ message: 'Course added!', entry: newEntry });
});

// DELETE /api/users/:id/courses/:entryId
router.delete('/:id/courses/:entryId', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const entryId = parseInt(req.params.entryId);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only remove your own courses.' });
  }

  const data = readDB();
  const entryIndex = data.user_courses.findIndex(uc => uc.id === entryId && uc.user_id === userId);

  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Course entry not found.' });
  }

  data.user_courses.splice(entryIndex, 1);
  writeDB(data);

  console.log(`User ${userId} removed course entry ${entryId}`);
  res.json({ message: 'Course removed!' });
});

module.exports = router;
