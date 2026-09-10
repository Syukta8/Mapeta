import './helpers/setupEnv.js';
import { setupTestDb } from './helpers/testDb.js';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../app.js';

describe('API Route Integration Tests', () => {
  before(() => {
    setupTestDb();
  });

  describe('Health API', () => {
    it('GET /api/health returns 200 OK status', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.app, 'Mapeta');
    });
  });

  describe('Incidents API', () => {
    let createdIncidentId = '';

    it('POST /api/incidents creates a valid incident', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .send({
          type: 'police',
          lat: 3.1415,
          lng: 101.6869,
          title: 'Speed Trap Jalan Ampang',
          durationHours: 2,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id.startsWith('inc_'));
      createdIncidentId = res.body.data.id;
    });

    it('POST /api/incidents rejects payload missing required fields', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .send({ title: 'No coords' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.includes('Missing required'));
    });

    it('GET /api/incidents returns list of active incidents', async () => {
      const res = await request(app).get('/api/incidents');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.some((i: any) => i.id === createdIncidentId));
    });

    it('POST /api/incidents/:id/vote updates votes', async () => {
      const res = await request(app)
        .post(`/api/incidents/${createdIncidentId}/vote`)
        .send({ vote: 'up' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.upvotes, 2);
    });

    it('POST /api/incidents/:id/vote returns 404 via centralized error handler for nonexistent ID', async () => {
      const res = await request(app)
        .post('/api/incidents/inc_nonexistent_9999/vote')
        .send({ vote: 'up' });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.includes('not found'));
    });
  });

  describe('Favorites API', () => {
    let homeId = '';

    it('POST /api/favorites saves a favorite place', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .send({
          name: 'Home',
          type: 'home',
          lat: 3.1234,
          lng: 101.5678,
          address: '42 Jalan Sultan',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
      homeId = res.body.data.id;
    });

    it('GET /api/favorites returns saved favorites', async () => {
      const res = await request(app).get('/api/favorites');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.some((f: any) => f.id === homeId));
    });

    it('DELETE /api/favorites/:id deletes the favorite', async () => {
      const res = await request(app).delete(`/api/favorites/${homeId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.id, homeId);
    });
  });

  describe('Geocode & Tile APIs', () => {
    it('GET /api/geocode/search returns empty list for blank query', async () => {
      const res = await request(app).get('/api/geocode/search?q=');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.deepStrictEqual(res.body.data, []);
    });

    it('GET /api/tiles/status returns offline tiles availability status', async () => {
      const res = await request(app).get('/api/tiles/status');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.hasOfflineMap, 'boolean');
    });
  });
});
