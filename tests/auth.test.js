// auth.test.js - Tests for user registration and login
//
// We use Jest (a JavaScript testing framework) and supertest (a library that
// lets us make fake HTTP requests to our Express app without starting a real server).
//
// To run tests: cd code/backend && npm test
//
// Each test() block checks one specific thing.
// expect() is how we check if the result is what we expected.
// If the result doesn't match, the test "fails" and shows an error.

// Set NODE_ENV to "test" so our db.js uses a separate test database
// This way tests don't mess with real user data
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import our Express app (we export it from server.js for this purpose)
const app = require('../code/backend/server');

// The test database file path (we'll clean it up after all tests run)
const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'hokiestudy-test.json');

// beforeAll() runs ONE TIME before any tests start
// We use it to make sure the test database is fresh (deleted)
beforeAll(() => {
  // Delete the test database if it exists from a previous run
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
    console.log('Cleaned up old test database');
  }
});

// afterAll() runs ONE TIME after all tests finish
// We clean up the test database file
afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
    console.log('Test database cleaned up');
  }
});

// =====================================================
// REGISTRATION TESTS
// =====================================================
describe('User Registration - POST /api/auth/register', () => {

  // Test 1: Registering with all required fields should work
  test('registers a new user with valid data', async () => {
    // request(app) creates a fake HTTP client for our Express app
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'teststudent@vt.edu',
        password: 'password123',
        year: 'Sophomore',
        age: 20
      });

    // We expect a 201 "Created" status code
    expect(response.status).toBe(201);

    // We expect the response to have a token (proof of login)
    expect(response.body.token).toBeDefined();

    // We expect the user object to be included
    expect(response.body.user).toBeDefined();
    expect(response.body.user.name).toBe('Test Student');
    expect(response.body.user.email).toBe('teststudent@vt.edu');

    // The password should NOT be included in the response (security!)
    expect(response.body.user.password).toBeUndefined();
  });

  // Test 2: Trying to register with an email that's already taken should fail
  test('rejects registration with duplicate email', async () => {
    // First registration (should succeed)
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'First Student',
        email: 'duplicate@vt.edu',
        password: 'password123'
      });

    // Second registration with the same email (should fail)
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Second Student',
        email: 'duplicate@vt.edu',  // Same email!
        password: 'differentpassword'
      });

    // We expect a 400 "Bad Request" status code
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  // Test 3: Missing required fields should fail
  test('rejects registration with missing required fields', async () => {
    // Sending only email (no name or password)
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'missing@vt.edu'
        // name and password are missing!
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

});

// =====================================================
// LOGIN TESTS
// =====================================================
describe('User Login - POST /api/auth/login', () => {

  // Register a user before running login tests
  // beforeAll inside a describe block runs before all tests in that describe block
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Test User',
        email: 'logintest@vt.edu',
        password: 'correctpassword',
        year: 'Junior'
      });
  });

  // Test 4: Logging in with correct credentials should return a token
  test('logs in with correct email and password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'logintest@vt.edu',
        password: 'correctpassword'
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('logintest@vt.edu');
  });

  // Test 5: Wrong password should be rejected
  test('rejects login with wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'logintest@vt.edu',
        password: 'wrongpassword'  // This is not the correct password
      });

    // We expect a 401 "Unauthorized" status
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  // Test 6: Non-existent email should be rejected
  test('rejects login with email that does not exist', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@vt.edu',   // This email was never registered
        password: 'somepassword'
      });

    expect(response.status).toBe(401);
  });

  // Test 7: Missing fields should be rejected
  test('rejects login with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'logintest@vt.edu'
        // password is missing!
      });

    expect(response.status).toBe(400);
  });

});
