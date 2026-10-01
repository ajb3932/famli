process.env.NODE_ENV = 'test';

const request = require('supertest');
const config = require('../src/config');
const { openDatabase } = require('../src/database');
const { createApp } = require('../src/app');

// Keep the suite fast; production uses config.bcryptRounds (12).
config.bcryptRounds = 4;

const ADMIN = { username: 'admin', email: 'admin@example.com', password: 'correct horse battery' };

function setupApp(options = {}) {
  const db = options.db ?? openDatabase(':memory:');
  const app = createApp(db, { frontendDist: '/nonexistent', ...options });
  return { db, app };
}

// Supertest agents keep cookies between requests, like a browser.
async function adminAgent(app) {
  const agent = request.agent(app);
  await agent.post('/api/auth/setup').send(ADMIN).expect(201);
  return agent;
}

async function createUserAgent(app, admin, { username, role }) {
  const password = `${username}-password-123`;
  await admin
    .post('/api/users')
    .send({ username, email: `${username}@example.com`, password, role })
    .expect(201);
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username, password }).expect(200);
  return agent;
}

module.exports = { request, setupApp, adminAgent, createUserAgent, ADMIN };
