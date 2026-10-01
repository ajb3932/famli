const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { request, setupApp, adminAgent, createUserAgent, ADMIN } = require('./helpers');

test('first run: status reports setup required, setup creates an admin and signs in', async () => {
  const { app } = setupApp();
  const agent = request.agent(app);

  const before = await agent.get('/api/auth/status').expect(200);
  assert.deepEqual(before.body, { setupRequired: true, user: null });

  const res = await agent.post('/api/auth/setup').send(ADMIN).expect(201);
  assert.equal(res.body.user.role, 'admin');
  assert.equal(res.body.user.password_hash, undefined);

  const cookie = res.headers['set-cookie'][0];
  assert.match(cookie, /famli_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.doesNotMatch(res.text, /famli_session|token/i, 'session token must not be in the body');

  const after = await agent.get('/api/auth/status').expect(200);
  assert.equal(after.body.setupRequired, false);
  assert.equal(after.body.user.username, ADMIN.username);
});

test('setup cannot be run twice', async () => {
  const { app } = setupApp();
  await adminAgent(app);
  await request(app)
    .post('/api/auth/setup')
    .send({ ...ADMIN, username: 'intruder', email: 'x@example.com' })
    .expect(409);
});

test('setup validates input', async () => {
  const { app } = setupApp();
  const res = await request(app)
    .post('/api/auth/setup')
    .send({ username: 'a', email: 'nope', password: 'short' })
    .expect(400);
  assert.ok(res.body.fields.username);
  assert.ok(res.body.fields.email);
  assert.ok(res.body.fields.password);
});

test('login: wrong password and unknown user give the same error', async () => {
  const { app } = setupApp();
  await adminAgent(app);

  const wrong = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'nope' }).expect(401);
  const unknown = await request(app).post('/api/auth/login').send({ username: 'ghost', password: 'nope' }).expect(401);
  assert.equal(wrong.body.error, unknown.body.error);
});

test('login is rate limited per IP', async () => {
  const { app } = setupApp({ loginLimit: 3 });
  await adminAgent(app);
  for (let i = 0; i < 3; i++) {
    await request(app).post('/api/auth/login').send({ username: 'admin', password: 'bad' }).expect(401);
  }
  await request(app).post('/api/auth/login').send({ username: 'admin', password: 'bad' }).expect(429);
});

test('logout revokes the session server-side', async () => {
  const { app } = setupApp();
  const agent = await adminAgent(app);
  const login = await agent.post('/api/auth/login').send(ADMIN).expect(200);
  const cookie = login.headers['set-cookie'][0].split(';')[0];

  await agent.post('/api/auth/logout').expect(204);
  // Replaying the old cookie must not work.
  await request(app).get('/api/households').set('Cookie', cookie).expect(401);
});

test('unauthenticated requests are rejected', async () => {
  const { app } = setupApp();
  await request(app).get('/api/households').expect(401);
  await request(app).get('/api/people').expect(401);
  await request(app).get('/api/users').expect(401);
});

test('legacy bcrypt hashes are upgraded on login', async () => {
  const { app, db } = setupApp();
  await adminAgent(app);
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(
    bcrypt.hashSync(ADMIN.password, 4),
    ADMIN.username
  );
  const config = require('../src/config');
  const original = config.bcryptRounds;
  config.bcryptRounds = 5;
  try {
    await request(app).post('/api/auth/login').send(ADMIN).expect(200);
    const { password_hash } = db.prepare('SELECT password_hash FROM users WHERE username = ?').get(ADMIN.username);
    assert.equal(bcrypt.getRounds(password_hash), 5);
  } finally {
    config.bcryptRounds = original;
  }
});

test('changing password requires the current one and signs out other devices', async () => {
  const { app } = setupApp();
  const deviceA = await adminAgent(app);
  const deviceB = request.agent(app);
  await deviceB.post('/api/auth/login').send(ADMIN).expect(200);

  await deviceA
    .post('/api/auth/password')
    .send({ currentPassword: 'wrong', newPassword: 'a brand new password' })
    .expect(400);
  await deviceA
    .post('/api/auth/password')
    .send({ currentPassword: ADMIN.password, newPassword: 'a brand new password' })
    .expect(204);

  await deviceA.get('/api/households').expect(200);
  await deviceB.get('/api/households').expect(401);
  await request(app).post('/api/auth/login').send({ username: 'admin', password: 'a brand new password' }).expect(200);
});

test('role changes apply to existing sessions immediately', async () => {
  const { app, db } = setupApp();
  const admin = await adminAgent(app);
  const editor = await createUserAgent(app, admin, { username: 'ed', role: 'editor' });

  await editor.post('/api/households').send({ name: 'Smiths' }).expect(201);
  const { id } = db.prepare("SELECT id FROM users WHERE username = 'ed'").get();
  await admin.put(`/api/users/${id}`).send({ role: 'viewer' }).expect(200);
  await editor.post('/api/households').send({ name: 'Joneses' }).expect(403);
});

test('cross-site state-changing requests are blocked', async () => {
  const { app } = setupApp();
  const agent = await adminAgent(app);

  await agent.post('/api/households').set('Sec-Fetch-Site', 'cross-site').send({ name: 'Evil' }).expect(403);
  await agent.post('/api/households').set('Origin', 'https://evil.example').send({ name: 'Evil' }).expect(403);
  await agent
    .post('/api/households')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send('name=Evil')
    .expect(415);
  await agent.post('/api/households').set('Sec-Fetch-Site', 'same-origin').send({ name: 'Good' }).expect(201);
});

test('security headers are set', async () => {
  const { app } = setupApp();
  const res = await request(app).get('/api/health').expect(200);
  assert.match(res.headers['content-security-policy'], /script-src 'self'/);
  assert.match(res.headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-powered-by'], undefined);
});
