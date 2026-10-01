const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setupApp, adminAgent, createUserAgent } = require('./helpers');
const { daysUntilBirthday } = require('../src/routes/people');

test('household CRUD with members, cascade delete and audit trail', async () => {
  const { app, db } = setupApp();
  const admin = await adminAgent(app);

  const { body: household } = await admin
    .post('/api/households')
    .send({ name: '  The Smiths ', city: 'Leeds', color_theme: '#10B981', notes: '' })
    .expect(201);
  assert.equal(household.name, 'The Smiths');
  assert.equal(household.color_theme, '#10b981');
  assert.equal(household.notes, null);

  await admin
    .post(`/api/households/${household.id}/members`)
    .send({ first_name: 'Jane', last_name: 'Smith', birthday: '1990-04-02', email: 'jane@example.com' })
    .expect(201);

  const list = await admin.get('/api/households').expect(200);
  assert.equal(list.body.households[0].member_count, 1);
  assert.equal(list.body.households[0].members_preview[0].first_name, 'Jane');

  // Searching matches member names too.
  const search = await admin.get('/api/households?search=jane').expect(200);
  assert.equal(search.body.pagination.total, 1);

  await admin.delete(`/api/households/${household.id}`).expect(204);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM household_members').get().n, 0, 'members cascade');

  const actions = db.prepare("SELECT action FROM audit_log WHERE entity_type != 'auth' ORDER BY id").all();
  assert.deepEqual(
    actions.map((a) => a.action),
    ['SETUP', 'CREATE', 'CREATE', 'DELETE']
  );
});

test('input validation rejects unsafe or malformed values', async () => {
  const { app } = setupApp();
  const admin = await adminAgent(app);

  await admin.post('/api/households').send({ name: '' }).expect(400);
  await admin.post('/api/households').send({ name: 'X', color_theme: 'red;background:url(x)' }).expect(400);
  await admin.post('/api/households').send({ name: 'x'.repeat(500) }).expect(400);

  const { body: h } = await admin.post('/api/households').send({ name: 'Ok' }).expect(201);
  await admin.post(`/api/households/${h.id}/members`).send({ first_name: 'A', birthday: '1990-13-45' }).expect(400);
  await admin.post(`/api/households/${h.id}/members`).send({ first_name: 'A', email: 'not-an-email' }).expect(400);
  await admin.get('/api/households/abc').expect(400);
  await admin.get('/api/households/999').expect(404);
});

test('search treats LIKE wildcards literally and limit is clamped', async () => {
  const { app } = setupApp();
  const admin = await adminAgent(app);
  await admin.post('/api/households').send({ name: 'Alpha' }).expect(201);
  await admin.post('/api/households').send({ name: '100% Beta' }).expect(201);

  const res = await admin.get('/api/households?search=%25').expect(200);
  assert.equal(res.body.pagination.total, 1);
  assert.equal(res.body.households[0].name, '100% Beta');

  const clamped = await admin.get('/api/households?limit=999999').expect(200);
  assert.ok(clamped.body.pagination.limit <= 100);
});

test('member routes cannot reach members of another household', async () => {
  const { app } = setupApp();
  const admin = await adminAgent(app);
  const { body: a } = await admin.post('/api/households').send({ name: 'A' }).expect(201);
  const { body: b } = await admin.post('/api/households').send({ name: 'B' }).expect(201);
  const { body: m } = await admin.post(`/api/households/${a.id}/members`).send({ first_name: 'Ann' }).expect(201);

  await admin.put(`/api/households/${b.id}/members/${m.id}`).send({ first_name: 'Hacked' }).expect(404);
  await admin.delete(`/api/households/${b.id}/members/${m.id}`).expect(404);
});

test('role permissions are enforced', async () => {
  const { app } = setupApp();
  const admin = await adminAgent(app);
  const viewer = await createUserAgent(app, admin, { username: 'vic', role: 'viewer' });
  const editor = await createUserAgent(app, admin, { username: 'eve', role: 'editor' });

  const { body: h } = await editor.post('/api/households').send({ name: 'Edited' }).expect(201);
  await viewer.post('/api/households').send({ name: 'Nope' }).expect(403);
  await viewer.get(`/api/households/${h.id}`).expect(200);
  await editor.delete(`/api/households/${h.id}`).expect(403);
  await editor.get('/api/users').expect(403);
  await editor.get('/api/users/audit/log').expect(403);
});

test('the last admin cannot be demoted or deleted', async () => {
  const { app, db } = setupApp();
  const admin = await adminAgent(app);
  const { id } = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();

  await admin.put(`/api/users/${id}`).send({ role: 'viewer' }).expect(400);
  await admin.delete(`/api/users/${id}`).expect(400);

  const { body: other } = await admin
    .post('/api/users')
    .send({ username: 'second', email: 's@example.com', password: 'password123', role: 'admin' })
    .expect(201);
  await admin.put(`/api/users/${id}`).send({ role: 'editor' }).expect(200);
  // Now "admin" is an editor and "second" is the only admin.
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n, 1);
  assert.ok(other.id);
});

test('duplicate usernames are rejected cleanly', async () => {
  const { app } = setupApp();
  const admin = await adminAgent(app);
  await admin
    .post('/api/users')
    .send({ username: 'admin', email: 'other@example.com', password: 'password123', role: 'viewer' })
    .expect(409);
});

test('people list sorts and paginates; birthdays endpoint works', async () => {
  const { app } = setupApp();
  const admin = await adminAgent(app);
  const { body: h } = await admin.post('/api/households').send({ name: 'Fam' }).expect(201);
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const soon = new Date(Date.UTC(1985, today.getMonth(), today.getDate() + 3));

  await admin.post(`/api/households/${h.id}/members`).send({ first_name: 'Zed', last_name: 'Adams' });
  await admin.post(`/api/households/${h.id}/members`).send({ first_name: 'Amy', last_name: 'Young', birthday: iso(soon) });

  const byFirst = await admin.get('/api/people?sortBy=first_name').expect(200);
  assert.deepEqual(byFirst.body.people.map((p) => p.first_name), ['Amy', 'Zed']);
  const byLast = await admin.get('/api/people?sortBy=last_name').expect(200);
  assert.deepEqual(byLast.body.people.map((p) => p.first_name), ['Zed', 'Amy']);
  // Unknown sort keys fall back safely rather than reaching SQL.
  await admin.get('/api/people?sortBy=id;DROP TABLE users').expect(200);

  const birthdays = await admin.get('/api/people/birthdays?days=30').expect(200);
  assert.equal(birthdays.body.people.length, 1);
  assert.equal(birthdays.body.people[0].first_name, 'Amy');
});

test('daysUntilBirthday handles wrap-around', () => {
  const today = new Date(Date.UTC(2026, 11, 30));
  assert.equal(daysUntilBirthday('1990-12-30', today), 0);
  assert.equal(daysUntilBirthday('1990-01-02', today), 3);
  assert.equal(daysUntilBirthday('1990-12-29', today), 364);
});
