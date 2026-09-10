import './helpers/setupEnv.js';
import { setupTestDb } from './helpers/testDb.js';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import type { Request, Response, NextFunction } from 'express';
import { LRUCache } from '../utils/LRUCache.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as incidentController from '../controllers/incidentController.js';
import * as favoriteController from '../controllers/favoriteController.js';
import * as geocodeController from '../controllers/geocodeController.js';
import * as tileController from '../controllers/tileController.js';
import * as healthController from '../controllers/healthController.js';
import * as incidentService from '../services/incidentService.js';
import * as favoriteService from '../services/favoriteService.js';
import * as tileService from '../services/tileService.js';
import * as geocodeService from '../services/geocodeService.js';

interface MockResponse {
  statusCode: number;
  body: any;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe('Backend MVVM Layer Tests', () => {
  before(() => {
    setupTestDb();
  });

  it('reports, lists, votes and deactivates incidents via service layer', () => {
    const reported = incidentService.reportIncident({
      type: 'police',
      lat: 3.1412,
      lng: 101.6865,
      title: 'Speed Trap',
      description: 'Under bridge',
      durationHours: 1,
    });

    assert.ok(reported.id.startsWith('inc_'), 'Generated ID format');
    assert.strictEqual(reported.type, 'police');
    assert.strictEqual(reported.upvotes, 1);
    assert.strictEqual(reported.active, 1);

    const activeList = incidentService.getActiveIncidents();
    const found = activeList.find((i) => i.id === reported.id);
    assert.ok(found, 'Reported incident found in active list');

    const upvoted = incidentService.voteIncident(reported.id, 'up');
    assert.strictEqual(upvoted.upvotes, 2);

    incidentService.voteIncident(reported.id, 'down');
    incidentService.voteIncident(reported.id, 'down');
    incidentService.voteIncident(reported.id, 'down');
    incidentService.voteIncident(reported.id, 'down');
    const deactivated = incidentService.voteIncident(reported.id, 'down');
    assert.strictEqual(deactivated.active, 0, 'Auto-deactivated when downvotes >= upvotes + 3');

    const updatedActiveList = incidentService.getActiveIncidents();
    assert.strictEqual(updatedActiveList.some((i) => i.id === reported.id), false);
  });

  it('purges expired incidents via purgeExpiredIncidents', () => {
    incidentService.reportIncident({
      type: 'hazard',
      lat: 3.15,
      lng: 101.69,
      title: 'Pothole',
      durationHours: -1,
    });

    const purgedCount = incidentService.purgeExpiredIncidents();
    assert.ok(purgedCount >= 1, 'Should have purged at least 1 expired incident');
  });

  it('saves, deduplicates home/work, and removes favorites via service layer', () => {
    const home1 = favoriteService.saveFavorite({
      name: 'Old House',
      type: 'home',
      lat: 3.1000,
      lng: 101.6000,
      address: 'Old Home Street',
    });

    assert.strictEqual(home1.type, 'home');
    assert.strictEqual(home1.name, 'Old House');

    const home2 = favoriteService.saveFavorite({
      name: 'New House',
      type: 'home',
      lat: 3.2000,
      lng: 101.7000,
      address: 'New Home Boulevard',
    });

    const list = favoriteService.listFavorites();
    const homeList = list.filter((f) => f.type === 'home');
    assert.strictEqual(homeList.length, 1, 'Only one home favorite can exist');
    assert.strictEqual(homeList[0].name, 'New House');

    const removed = favoriteService.removeFavorite(home2.id);
    assert.strictEqual(removed.id, home2.id);

    const afterRemove = favoriteService.listFavorites();
    assert.strictEqual(afterRemove.some((f) => f.id === home2.id), false);
  });

  it('tileService correctly returns status', () => {
    const status = tileService.getOfflineStatus();
    assert.strictEqual(typeof status.hasOfflineMap, 'boolean');
  });

  it('geocodeService returns empty array for empty queries', async () => {
    const res = await geocodeService.searchPlaces('', 5);
    assert.deepStrictEqual(res, []);
    const resSpaces = await geocodeService.searchPlaces('   ', 5);
    assert.deepStrictEqual(resSpaces, []);
  });
});

describe('API Controller Integration Tests', () => {
  let createdIncidentId = '';
  let homeId = '';

  it('healthController returns 200 OK status', () => {
    const req = {} as Request;
    const res = createMockRes();
    healthController.getHealth(req, res as unknown as Response);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.app, 'Mapeta');
  });

  it('incidentController.create saves valid incident with 201', async () => {
    const req = {
      body: {
        type: 'police',
        lat: 3.1415,
        lng: 101.6869,
        title: 'Speed Trap Jalan Ampang',
        durationHours: 2,
      },
    } as Request;
    const res = createMockRes();
    const next = (() => {}) as NextFunction;

    await incidentController.create(req, res as unknown as Response, next);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id.startsWith('inc_'));
    createdIncidentId = res.body.data.id;
  });

  it('incidentController.create rejects invalid payload with 400', async () => {
    const req = { body: { title: 'Missing coords and type' } } as Request;
    const res = createMockRes();
    const next = (() => {}) as NextFunction;

    await incidentController.create(req, res as unknown as Response, next);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Missing required'));
  });

  it('incidentController.getAll returns active incidents list', async () => {
    const req = {} as Request;
    const res = createMockRes();
    const next = (() => {}) as NextFunction;

    await incidentController.getAll(req, res as unknown as Response, next);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((i: { id: string }) => i.id === createdIncidentId));
  });

  it('incidentController.vote increments upvote', async () => {
    const req = {
      params: { id: createdIncidentId },
      body: { vote: 'up' },
    } as unknown as Request;
    const res = createMockRes();
    const next = (() => {}) as NextFunction;

    await incidentController.vote(req, res as unknown as Response, next);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.upvotes, 2);
  });

  it('incidentController.vote routes 404 for nonexistent incident through errorHandler', async () => {
    const req = {
      params: { id: 'inc_nonexistent_9999' },
      body: { vote: 'up' },
    } as unknown as Request;
    const res = createMockRes();

    let capturedError: Error | null = null;
    const next: NextFunction = (err?: any) => {
      capturedError = err;
    };

    await incidentController.vote(req, res as unknown as Response, next);

    assert.ok(capturedError, 'Error should be passed to next()');
    errorHandler(capturedError, req, res as unknown as Response, next);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('not found'));
  });

  it('favoriteController saves, lists, and deletes favorites', async () => {
    const createReq = {
      body: {
        name: 'Office',
        type: 'work',
        lat: 3.1500,
        lng: 101.7100,
        address: 'Tower 2 KLCC',
      },
    } as Request;
    const createRes = createMockRes();
    const next = (() => {}) as NextFunction;

    await favoriteController.create(createReq, createRes as unknown as Response, next);
    assert.strictEqual(createRes.statusCode, 200);
    assert.strictEqual(createRes.body.success, true);
    homeId = createRes.body.data.id;

    const listReq = {} as Request;
    const listRes = createMockRes();
    await favoriteController.getAll(listReq, listRes as unknown as Response, next);
    assert.strictEqual(listRes.statusCode, 200);
    assert.ok(listRes.body.data.some((f: { id: string }) => f.id === homeId));

    const deleteReq = { params: { id: homeId } } as unknown as Request;
    const deleteRes = createMockRes();
    await favoriteController.remove(deleteReq, deleteRes as unknown as Response, next);
    assert.strictEqual(deleteRes.statusCode, 200);
    assert.strictEqual(deleteRes.body.data.id, homeId);
  });

  it('geocodeController.search returns empty list for blank query', async () => {
    const req = { query: { q: '' } } as unknown as Request;
    const res = createMockRes();
    const next = (() => {}) as NextFunction;

    await geocodeController.search(req, res as unknown as Response, next);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body.data, []);
  });

  it('tileController.getStatus returns offline tile status', async () => {
    const req = {} as Request;
    const res = createMockRes();
    const next = (() => {}) as NextFunction;

    await tileController.getStatus(req, res as unknown as Response, next);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(typeof res.body.hasOfflineMap, 'boolean');
  });
});

describe('LRUCache Utility Tests', () => {
  it('stores and retrieves cached entries', () => {
    const cache = new LRUCache<string, number>(3, 5000);
    cache.set('a', 1);
    cache.set('b', 2);

    assert.strictEqual(cache.get('a'), 1);
    assert.strictEqual(cache.get('b'), 2);
    assert.strictEqual(cache.get('c'), undefined);
    assert.strictEqual(cache.size, 2);
  });

  it('evicts least-recently-used item when capacity is reached', () => {
    const cache = new LRUCache<string, string>(3, 5000);
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    cache.set('k3', 'v3');

    assert.strictEqual(cache.get('k1'), 'v1');
    cache.set('k4', 'v4');

    assert.strictEqual(cache.get('k2'), undefined, 'k2 should have been evicted');
    assert.strictEqual(cache.get('k1'), 'v1', 'k1 should still exist');
    assert.strictEqual(cache.get('k3'), 'v3', 'k3 should still exist');
    assert.strictEqual(cache.get('k4'), 'v4', 'k4 should still exist');
    assert.strictEqual(cache.size, 3);
  });

  it('expires items past their TTL immediately with negative TTL', () => {
    const cache = new LRUCache<string, string>(3, 5000);
    cache.set('temp', 'val', -1);

    assert.strictEqual(cache.get('temp'), undefined, 'Expired item should return undefined');
    assert.strictEqual(cache.has('temp'), false);
    assert.strictEqual(cache.size, 0);
  });

  it('clears all entries on clear()', () => {
    const cache = new LRUCache<string, number>(5, 5000);
    cache.set('x', 10);
    cache.set('y', 20);
    assert.strictEqual(cache.size, 2);

    cache.clear();
    assert.strictEqual(cache.size, 0);
    assert.strictEqual(cache.get('x'), undefined);
  });
});
