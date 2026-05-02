// basic API endpoint tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../code/backend/server');

const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'hokiestudy-test.json');

let testToken = '';
let testUserId = 0;

beforeAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);

  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'API Test User', email: 'apitest@vt.edu', password: 'testpass123', year: 'Senior' });

  testToken = res.body.token;
  testUserId = res.body.user.id;
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

test('course search returns results', async () => {
  const res = await request(app).get('/api/courses?search=CS');
  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
});

test('protected route rejects request without token', async () => {
  const res = await request(app).get(`/api/users/${testUserId}`);
  expect(res.status).toBe(401);
});

test('returns user profile with valid token', async () => {
  const res = await request(app)
    .get(`/api/users/${testUserId}`)
    .set('Authorization', `Bearer ${testToken}`);
  expect(res.status).toBe(200);
  expect(res.body.password).toBeUndefined();
});

test('saves and retrieves availability', async () => {
  const slots = [
    { day_of_week: 'Monday', start_time: '10:00', end_time: '11:00' },
    { day_of_week: 'Friday', start_time: '14:00', end_time: '15:00' }
  ];

  await request(app)
    .post(`/api/users/${testUserId}/availability`)
    .set('Authorization', `Bearer ${testToken}`)
    .send({ slots });

  const res = await request(app)
    .get(`/api/users/${testUserId}/availability`)
    .set('Authorization', `Bearer ${testToken}`);

  expect(res.status).toBe(200);
  expect(res.body.length).toBe(2);
});
