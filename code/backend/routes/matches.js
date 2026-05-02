// matches.js - Route for finding study partner matches
//
// Route in this file:
//   GET /api/users/:id/matches - Find students who share courses with the current user
//
// How the matching works:
//   1. Get a list of all the courses the current user is taking
//   2. Search through all other users to find anyone taking the same courses
//   3. Count how many courses each person shares with the current user
//   4. Sort the matches so that people sharing more courses appear first
//   5. Also check if their availability overlaps (same free time slots)

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB } = require('../database/db');

// =====================================================
// GET /api/users/:id/matches
// Returns a list of students who share courses with this user
// =====================================================
router.get('/:id/matches', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  const data = readDB();

  // Step 1: Find all the course IDs that the current user is taking
  // .filter() finds all user_courses entries for this user
  // .map() extracts just the course_id from each entry
  const myCourseIds = data.user_courses
    .filter(uc => uc.user_id === userId)
    .map(uc => uc.course_id);

  // If the user hasn't added any courses yet, there's nothing to match on
  if (myCourseIds.length === 0) {
    return res.json([]); // Return empty array - no courses = no matches
  }

  // Total number of courses the current user is taking (used for percentage)
  const myTotalCourses = myCourseIds.length;

  // Step 2: Find other users who share at least one course with the current user
  // .includes() checks if a value is in the array (like SQL's IN operator)
  const sharedCourseEntries = data.user_courses.filter(uc =>
    uc.user_id !== userId && myCourseIds.includes(uc.course_id)
  );

  // Step 3: Count how many shared courses each other user has
  // We use an object as a "counter" - the key is the user ID, value is the count
  // This is similar to a GROUP BY COUNT in SQL
  const matchCounts = {};
  for (const entry of sharedCourseEntries) {
    if (matchCounts[entry.user_id]) {
      matchCounts[entry.user_id] += 1; // Already seen this user, increment count
    } else {
      matchCounts[entry.user_id] = 1;  // First time seeing this user, start at 1
    }
  }

  // Step 4: Get the current user's availability for overlap checking
  const myAvailability = data.availability.filter(a => a.user_id === userId);

  // Step 5: Build the full match objects with all the details
  // Object.entries() turns our counter object into an array of [userId, count] pairs
  const matches = Object.entries(matchCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending (most shared courses first)
    .map(([matchUserId, sharedCount]) => {
      const matchUserIdNum = parseInt(matchUserId);

      // Look up the matched user's profile info
      const matchUser = data.users.find(u => u.id === matchUserIdNum);

      // If user was deleted somehow, skip them
      if (!matchUser) return null;

      // Find which specific courses they share with us
      // Filter user_courses to only the shared ones for this matched user
      const sharedCourseIds = data.user_courses
        .filter(uc => uc.user_id === matchUserIdNum && myCourseIds.includes(uc.course_id))
        .map(uc => uc.course_id);

      // Look up the full course details for those shared courses
      const sharedCourses = data.courses
        .filter(c => sharedCourseIds.includes(c.id))
        .map(c => ({ course_code: c.course_code, course_name: c.course_name }));

      // Find overlapping availability (same day AND same time slot as the current user)
      const theirAvailability = data.availability.filter(a => a.user_id === matchUserIdNum);
      const overlappingSlots = myAvailability.filter(mySlot =>
        theirAvailability.some(theirSlot =>
          theirSlot.day_of_week === mySlot.day_of_week &&
          theirSlot.start_time === mySlot.start_time
        )
      );

      // Calculate match percentage:
      // How many of the current user's courses does this person share?
      // Example: if you have 4 courses and share 3, that's a 75% match
      const matchPercentage = Math.round((sharedCount / myTotalCourses) * 100);

      return {
        user: {
          id: matchUser.id,
          name: matchUser.name,
          year: matchUser.year || 'Not specified'
        },
        sharedCourseCount: sharedCount,
        myTotalCourses: myTotalCourses,
        matchPercentage: matchPercentage,
        sharedCourses: sharedCourses,
        overlappingAvailability: overlappingSlots.map(s => ({
          day: s.day_of_week,
          time: s.start_time
        }))
      };
    })
    .filter(match => match !== null); // Remove any null entries (deleted users)

  console.log(`Found ${matches.length} matches for user ${userId}`);
  res.json(matches);
});

module.exports = router;
