// tests for the study partner matching algorithm
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../code/backend/server');

const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'hokiestudy-test.json');

beforeAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

async function registerAndGetToken(name, email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123', year: 'Junior' });
  return { token: res.body.token, user: res.body.user };
}

async function addCourse(userId, courseId, token) {
  return request(app)
    .post(`/api/users/${userId}/courses`)
    .set('Authorization', `Bearer ${token}`)
    .send({ course_id: courseId, professor: 'Test Prof', section: '01' });
}

describe('GET /api/users/:id/matches', () => {
  test('finds a match when two students share a course', async () => {
    const s1 = await registerAndGetToken('Alice', 'alice@vt.edu');
    const s2 = await registerAndGetToken('Bob', 'bob@vt.edu');

    await addCourse(s1.user.id, 1, s1.token);
    await addCourse(s2.user.id, 1, s2.token);

    const res = await request(app)
      .get(`/api/users/${s1.user.id}/matches`)
      .set('Authorization', `Bearer ${s1.token}`);

    expect(res.status).toBe(200);
    const names = res.body.map(m => m.user.name);
    expect(names).toContain('Bob');
  });

  test('does not include the current user in their own matches', async () => {
    const s = await registerAndGetToken('Charlie', 'charlie@vt.edu');
    await addCourse(s.user.id, 2, s.token);

    const res = await request(app)
      .get(`/api/users/${s.user.id}/matches`)
      .set('Authorization', `Bearer ${s.token}`);

    const names = res.body.map(m => m.user.name);
    expect(names).not.toContain('Charlie');
  });

  test('returns empty array for user with no courses', async () => {
    const s = await registerAndGetToken('Dave', 'dave@vt.edu');

    const res = await request(app)
      .get(`/api/users/${s.user.id}/matches`)
      .set('Authorization', `Bearer ${s.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('rejects request without a token', async () => {
    const res = await request(app).get('/api/users/1/matches');
    expect(res.status).toBe(401);
  });
});
