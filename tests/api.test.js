// api.test.js - Tests for various API endpoints
//
// This file tests:
//   - Course search (GET /api/courses?search=...)
//   - Protected route access (must have a token)
//   - Availability save and retrieve
//   - Adding and listing user courses

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../code/backend/server');

const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'hokiestudy-test.json');

// Clean up test database
beforeAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

// Shared test user - registered once and reused across tests
let testToken = '';
let testUserId = 0;

// Register a test user once before all tests in this file run
beforeAll(async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'API Test User',
      email: 'apitest@vt.edu',
      password: 'testpassword123',
      year: 'Senior'
    });

  testToken = response.body.token;
  testUserId = response.body.user.id;
  console.log('Test user created with ID:', testUserId);
});

// =====================================================
// COURSE SEARCH TESTS
// =====================================================
describe('Course Search - GET /api/courses', () => {

  // Test 1: Searching "CS" should return Computer Science courses
  test('returns courses matching the search term', async () => {
    const response = await request(app)
      .get('/api/courses?search=CS');

    expect(response.status).toBe(200);

    // Should return an array
    expect(Array.isArray(response.body)).toBe(true);

    // Should return some CS courses
    expect(response.body.length).toBeGreaterThan(0);

    // All results should contain "CS" in the course code or name
    response.body.forEach(course => {
      const matchesCode = course.course_code.toLowerCase().includes('cs');
      const matchesName = course.course_name.toLowerCase().includes('cs');
      expect(matchesCode || matchesName).toBe(true);
    });
  });

  // Test 2: Searching "Calculus" should return math courses
  test('returns courses matching course name keywords', async () => {
    const response = await request(app)
      .get('/api/courses?search=Calculus');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test 3: No search term returns courses (up to limit of 20)
  test('returns courses with no search term', async () => {
    const response = await request(app)
      .get('/api/courses');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.length).toBeLessThanOrEqual(20);
  });

});

// =====================================================
// PROTECTED ROUTE TESTS
// =====================================================
describe('Protected Routes - require authentication token', () => {

  // Test 4: Getting user profile without a token should fail
  test('rejects profile request without token', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}`);
    // No Authorization header

    expect(response.status).toBe(401);
  });

  // Test 5: Getting user profile WITH a valid token should work
  test('returns profile with valid token', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('apitest@vt.edu');
    // Password should not be in the response
    expect(response.body.password).toBeUndefined();
  });

  // Test 6: Using a fake/invalid token should be rejected
  test('rejects request with invalid token', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}`)
      .set('Authorization', 'Bearer this_is_not_a_valid_token');

    expect(response.status).toBe(401);
  });

});

// =====================================================
// AVAILABILITY TESTS
// =====================================================
describe('Availability - POST and GET /api/users/:id/availability', () => {

  // The slots we'll save in the test
  const testSlots = [
    { day_of_week: 'Monday', start_time: '08:00', end_time: '10:00' },
    { day_of_week: 'Wednesday', start_time: '14:00', end_time: '16:00' },
    { day_of_week: 'Friday', start_time: '10:00', end_time: '12:00' }
  ];

  // Test 7: Saving availability should work
  test('saves availability slots successfully', async () => {
    const response = await request(app)
      .post(`/api/users/${testUserId}/availability`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ slots: testSlots });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('saved');
  });

  // Test 8: Retrieving availability should return what we saved
  test('retrieves the saved availability slots', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}/availability`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    // Should have the same number of slots we saved
    expect(response.body.length).toBe(testSlots.length);

    // Check that Monday slot is in there
    const mondaySlot = response.body.find(s => s.day_of_week === 'Monday');
    expect(mondaySlot).toBeDefined();
    expect(mondaySlot.start_time).toBe('08:00');
  });

});

// =====================================================
// USER COURSES TESTS
// =====================================================
describe('User Courses - POST and GET /api/users/:id/courses', () => {

  // Test 9: Adding a course to user profile should work
  test('adds a course to the user profile', async () => {
    const response = await request(app)
      .post(`/api/users/${testUserId}/courses`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        course_id: 1,          // Course ID 1 = CS 1044
        professor: 'Test Prof',
        section: '01'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('added');
  });

  // Test 10: Getting user courses should show what we added
  test('retrieves the list of user courses', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}/courses`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    // The course we added should be in the list
    const addedCourse = response.body.find(c => c.course_code === 'CS 1044');
    expect(addedCourse).toBeDefined();
    expect(addedCourse.professor).toBe('Test Prof');
  });

  // Test 11: Adding the same course twice should be rejected
  test('rejects adding the same course twice', async () => {
    const response = await request(app)
      .post(`/api/users/${testUserId}/courses`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        course_id: 1, // Already added this one above!
        professor: 'Another Prof'
      });

    expect(response.status).toBe(400);
  });

});
