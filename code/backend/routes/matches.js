const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB } = require('../database/db');

// GET /api/users/:id/matches
// finds all students who share at least one course with the current user
router.get('/:id/matches', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const data = readDB();

  const myCourseIds = data.user_courses
    .filter(uc => uc.user_id === userId)
    .map(uc => uc.course_id);

  if (myCourseIds.length === 0) {
    return res.json([]);
  }

  const myTotalCourses = myCourseIds.length;

  // find other users who take any of my courses
  const sharedCourseEntries = data.user_courses.filter(uc =>
    uc.user_id !== userId && myCourseIds.includes(uc.course_id)
  );

  // count how many shared courses each person has
  const matchCounts = {};
  for (const entry of sharedCourseEntries) {
    matchCounts[entry.user_id] = (matchCounts[entry.user_id] || 0) + 1;
  }

  const myAvailability = data.availability.filter(a => a.user_id === userId);

  const matches = Object.entries(matchCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([matchUserId, sharedCount]) => {
      const matchUserIdNum = parseInt(matchUserId);
      const matchUser = data.users.find(u => u.id === matchUserIdNum);
      if (!matchUser) return null;

      const sharedCourseIds = data.user_courses
        .filter(uc => uc.user_id === matchUserIdNum && myCourseIds.includes(uc.course_id))
        .map(uc => uc.course_id);

      const sharedCourses = data.courses
        .filter(c => sharedCourseIds.includes(c.id))
        .map(c => ({ course_code: c.course_code, course_name: c.course_name }));

      const theirAvailability = data.availability.filter(a => a.user_id === matchUserIdNum);
      const overlappingSlots = myAvailability.filter(mySlot =>
        theirAvailability.some(theirSlot =>
          theirSlot.day_of_week === mySlot.day_of_week &&
          theirSlot.start_time === mySlot.start_time
        )
      );

      const matchPercentage = Math.round((sharedCount / myTotalCourses) * 100);

      return {
        user: { id: matchUser.id, name: matchUser.name, year: matchUser.year || 'Not specified' },
        sharedCourseCount: sharedCount,
        myTotalCourses,
        matchPercentage,
        sharedCourses,
        overlappingAvailability: overlappingSlots.map(s => ({
          day: s.day_of_week,
          time: s.start_time
        }))
      };
    })
    .filter(match => match !== null);

  console.log(`Found ${matches.length} matches for user ${userId}`);
  res.json(matches);
});

module.exports = router;
