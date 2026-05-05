const request = require('supertest');
const app = require('../src/index');

describe('AjaiaDocs API Tests', () => {
  let aliceToken, bobToken, docId;

  describe('Auth', () => {
    test('POST /api/auth/login - valid credentials returns token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@demo.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('alice@demo.com');
      aliceToken = res.body.token;
    });

    test('POST /api/auth/login - wrong password returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@demo.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    test('POST /api/auth/login - missing fields returns 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@demo.com' });

      expect(res.status).toBe(400);
    });

    test('GET /api/auth/me - authenticated user returns profile', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@demo.com', password: 'password123' });
      aliceToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('alice@demo.com');
    });

    test('GET /api/auth/me - no token returns 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Documents', () => {
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@demo.com', password: 'password123' });
      aliceToken = res.body.token;

      const bobRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bob@demo.com', password: 'password123' });
      bobToken = bobRes.body.token;
    });

    test('GET /api/documents - returns owned and shared documents', async () => {
      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('owned');
      expect(res.body).toHaveProperty('shared');
      expect(Array.isArray(res.body.owned)).toBe(true);
    });

    test('POST /api/documents - creates a new document', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ title: 'Test Document', content: '<p>Hello World</p>' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Document');
      expect(res.body.content).toBe('<p>Hello World</p>');
      docId = res.body.id;
    });

    test('PATCH /api/documents/:id - updates document title and content', async () => {
      const res = await request(app)
        .patch(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
    });

    test('GET /api/documents/:id - owner can read document', async () => {
      const res = await request(app)
        .get(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('owner');
    });

    test('GET /api/documents/:id - unauthorized user gets 403', async () => {
      const res = await request(app)
        .get(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
    });

    test('POST /api/documents/:id/share - owner can share document', async () => {
      const res = await request(app)
        .post(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ email: 'bob@demo.com', permission: 'edit' });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('bob@demo.com');
    });

    test('GET /api/documents/:id - shared user can now read document', async () => {
      const res = await request(app)
        .get(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('edit');
    });

    test('DELETE /api/documents/:id - only owner can delete', async () => {
      const bobDeleteRes = await request(app)
        .delete(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobDeleteRes.status).toBe(403);

      const res = await request(app)
        .delete(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Health', () => {
    test('GET /api/health returns ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
