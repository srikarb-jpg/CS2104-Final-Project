// matching.test.js - Tests for the study partner matching system
//
// These tests verify that the matching algorithm works correctly:
//   - Students sharing courses show up as matches
//   - Matches are sorted by number of shared courses
//   - The current user doesn't appear in their own matches
//   - Users with no courses get no matches

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../code/backend/server');

const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'hokiestudy-test.json');

// Clean up test database before and after
beforeAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

// Helper function to register a user and get their token + user info
// We'll reuse this in multiple tests to avoid repeating the same code
async function registerAndGetToken(name, email) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123', year: 'Junior' });
  return {
    token: response.body.token,
    user: response.body.user
  };
}

// Helper function to add a course to a user's profile
// courseId is the ID of a course from our courses.json data
async function addCourse(userId, courseId, token) {
  return request(app)
    .post(`/api/users/${userId}/courses`)
    .set('Authorization', `Bearer ${token}`)  // .set() adds a header to the request
    .send({ course_id: courseId, professor: 'Test Prof', section: '01' });
}

// =====================================================
// MATCHING TESTS
// =====================================================
describe('Study Partner Matching - GET /api/users/:id/matches', () => {

  // Test 1: Two students sharing a course should appear as each other's match
  test('finds a match when two students share a course', async () => {
    // Register student 1
    const student1 = await registerAndGetToken('Alice VT', 'alice@vt.edu');

    // Register student 2
    const student2 = await registerAndGetToken('Bob VT', 'bob@vt.edu');

    // Both students add course ID 1 (CS 1044 from our courses.json)
    await addCourse(student1.user.id, 1, student1.token);
    await addCourse(student2.user.id, 1, student2.token);

    // Get student 1's matches
    const response = await request(app)
      .get(`/api/users/${student1.user.id}/matches`)
      .set('Authorization', `Bearer ${student1.token}`);

    expect(response.status).toBe(200);

    // Student 2 should appear in student 1's matches
    const matchNames = response.body.map(m => m.user.name);
    expect(matchNames).toContain('Bob VT');
  });

  // Test 2: A user should NOT appear in their own matches
  test('does not include the current user in their own matches', async () => {
    const student = await registerAndGetToken('Charlie VT', 'charlie@vt.edu');

    // Add a course to themselves
    await addCourse(student.user.id, 2, student.token);

    // Get their matches
    const response = await request(app)
      .get(`/api/users/${student.user.id}/matches`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(response.status).toBe(200);

    // Their own name should NOT be in the matches
    const matchNames = response.body.map(m => m.user.name);
    expect(matchNames).not.toContain('Charlie VT');
  });

  // Test 3: User with no courses should get empty matches array
  test('returns empty array for user with no courses', async () => {
    // Register a user but don't add any courses
    const student = await registerAndGetToken('Dave VT', 'dave@vt.edu');

    const response = await request(app)
      .get(`/api/users/${student.user.id}/matches`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(response.status).toBe(200);

    // Should return an empty array since they have no courses
    expect(response.body).toEqual([]);
  });

  // Test 4: Matches should be sorted by number of shared courses (most first)
  test('sorts matches by number of shared courses (most shared first)', async () => {
    // Register the main student
    const mainStudent = await registerAndGetToken('Eve VT', 'eve@vt.edu');

    // Register student A - shares 2 courses
    const studentA = await registerAndGetToken('Frank VT', 'frank@vt.edu');

    // Register student B - shares 1 course
    const studentB = await registerAndGetToken('Grace VT', 'grace@vt.edu');

    // Main student adds 3 courses (IDs 3, 4, 5)
    await addCourse(mainStudent.user.id, 3, mainStudent.token);
    await addCourse(mainStudent.user.id, 4, mainStudent.token);
    await addCourse(mainStudent.user.id, 5, mainStudent.token);

    // Student A shares 2 of those courses (IDs 3 and 4)
    await addCourse(studentA.user.id, 3, studentA.token);
    await addCourse(studentA.user.id, 4, studentA.token);

    // Student B shares only 1 course (ID 5)
    await addCourse(studentB.user.id, 5, studentB.token);

    // Get main student's matches
    const response = await request(app)
      .get(`/api/users/${mainStudent.user.id}/matches`)
      .set('Authorization', `Bearer ${mainStudent.token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(2);

    // Frank (2 shared courses) should appear before Grace (1 shared course)
    const matchNames = response.body.map(m => m.user.name);
    const frankIndex = matchNames.indexOf('Frank VT');
    const graceIndex = matchNames.indexOf('Grace VT');

    // Frank's position should be a smaller number (closer to front of array)
    expect(frankIndex).toBeLessThan(graceIndex);
  });

  // Test 5: Accessing matches without a token should be rejected
  test('rejects request without authentication token', async () => {
    const response = await request(app)
      .get('/api/users/1/matches');
    // No Authorization header!

    // Should get 401 Unauthorized
    expect(response.status).toBe(401);
  });

});
