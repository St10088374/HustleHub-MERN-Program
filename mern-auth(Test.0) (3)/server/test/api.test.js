process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../server');

test('Backend Security & API Unit Tests', async (t) => {
  await t.test('GET / returns health status and security protocol information', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.version, '2.0.0');
    assert.equal(res.body.message, 'HustleHub+ API is running');
    assert.ok(res.headers['x-content-type-options'], 'nosniff header should be present');
    assert.ok(res.headers['content-security-policy'], 'CSP header should be present');
  });

  await t.test('POST /api/auth/register rejects missing fields with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@test.com' });
    assert.equal(res.status, 400);
    assert.ok(res.body.message, 'Error message should be returned');
  });

  await t.test('POST /api/auth/register rejects short passwords with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'shortpass@example.com',
        password: '123',
      });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least 6 characters/i);
  });

  await t.test('POST /api/auth/register rejects privilege escalation to admin with 400 or 403', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Attacker Admin',
        email: 'attacker@example.com',
        password: 'password123',
        role: 'admin',
      });
    assert.ok([400, 403].includes(res.status), 'Admin self-registration must be blocked with 400 or 403');
  });

  await t.test('POST /api/auth/login rejects empty password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    assert.equal(res.status, 400);
    assert.ok(res.body.message);
  });

  await t.test('GET /api/auth/user rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/auth/user');
    assert.equal(res.status, 401);
    assert.match(res.body.message, /not authorized/i);
  });

  await t.test('GET /api/auth/user rejects malformed JWT token with 401', async () => {
    const res = await request(app)
      .get('/api/auth/user')
      .set('Authorization', 'Bearer invalid_bogus_jwt_token_here');
    assert.equal(res.status, 401);
    assert.match(res.body.message, /invalid or expired/i);
  });

  await t.test('POST /api/gigs rejects unauthenticated request with 401', async () => {
    const res = await request(app)
      .post('/api/gigs')
      .send({ title: 'Unauthorized Gig' });
    assert.equal(res.status, 401);
  });

  await t.test('GET /api/transactions/my rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/transactions/my');
    assert.equal(res.status, 401);
  });

  await t.test('GET /api/transactions/summary rejects invalid year format with 401 or 400', async () => {
    const res = await request(app).get('/api/transactions/summary?year=invalid_year');
    assert.ok([400, 401].includes(res.status));
  });

  await t.test('GET /non-existent-route returns clean 404 without leaking server internals', async () => {
    const res = await request(app).get('/api/non-existent-route-xyz');
    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Route not found');
    assert.equal(res.body.stack, undefined, 'Stack trace must not be exposed');
  });
});
