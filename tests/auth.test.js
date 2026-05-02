// tests for register and login endpoints
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

describe('POST /api/auth/register', () => {
  test('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Student', email: 'test@vt.edu', password: 'password123', year: 'Sophomore' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@vt.edu');
    expect(res.body.user.password).toBeUndefined(); // password should not be returned
  });

  test('rejects duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'First', email: 'dup@vt.edu', password: 'pass123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Second', email: 'dup@vt.edu', password: 'pass456' });

    expect(res.status).toBe(400);
  });

  test('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@vt.edu' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email: 'logintest@vt.edu', password: 'correctpass' });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logintest@vt.edu', password: 'correctpass' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logintest@vt.edu', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@vt.edu', password: 'pass' });

    expect(res.status).toBe(401);
  });
});
