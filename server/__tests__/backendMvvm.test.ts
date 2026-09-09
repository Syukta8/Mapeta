import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { initDatabase, db } from '../db/database.js';
import * as incidentService from '../services/incidentService.js';
import * as favoriteService from '../services/favoriteService.js';
import * as tileService from '../services/tileService.js';
import * as geocodeService from '../services/geocodeService.js';

describe('Backend MVVM Layer Tests', () => {
  before(() => {
    initDatabase();
  });

  it('reports, lists, votes and deactivates incidents via service layer', () => {
    // 1. Report incident
    const reported = incidentService.reportIncident({
      type: 'police',
      lat: 3.1412,
      lng: 101.6865,
      title: 'Speed Trap',
      description: 'Under bridge',
      durationHours: 1
    });

    assert.ok(reported.id.startsWith('inc_'), 'Generated ID format');
    assert.strictEqual(reported.type, 'police');
    assert.strictEqual(reported.upvotes, 1);
    assert.strictEqual(reported.active, 1);

    // 2. List active incidents
    const activeList = incidentService.getActiveIncidents();
    const found = activeList.find(i => i.id === reported.id);
    assert.ok(found, 'Reported incident found in active list');

    // 3. Upvote
    const upvoted = incidentService.voteIncident(reported.id, 'up');
    assert.strictEqual(upvoted.upvotes, 2);

    // 4. Downvote repeatedly to trigger auto-deactivation (downvotes >= upvotes + 3)
    // Currently: upvotes=2, downvotes=0. Needed downvotes >= 5
    incidentService.voteIncident(reported.id, 'down');
    incidentService.voteIncident(reported.id, 'down');
    incidentService.voteIncident(reported.id, 'down');
    incidentService.voteIncident(reported.id, 'down');
    const deactivated = incidentService.voteIncident(reported.id, 'down');
    assert.strictEqual(deactivated.active, 0, 'Auto-deactivated when downvotes >= upvotes + 3');

    // Verify it is no longer in active list
    const updatedActiveList = incidentService.getActiveIncidents();
    assert.strictEqual(updatedActiveList.some(i => i.id === reported.id), false);
  });

  it('saves, deduplicates home/work, and removes favorites via service layer', () => {
    // 1. Save Home 1
    const home1 = favoriteService.saveFavorite({
      name: 'Old House',
      type: 'home',
      lat: 3.1000,
      lng: 101.6000,
      address: 'Old Home Street'
    });

    assert.strictEqual(home1.type, 'home');
    assert.strictEqual(home1.name, 'Old House');

    // 2. Save Home 2 (should replace Home 1)
    const home2 = favoriteService.saveFavorite({
      name: 'New House',
      type: 'home',
      lat: 3.2000,
      lng: 101.7000,
      address: 'New Home Boulevard'
    });

    const list = favoriteService.listFavorites();
    const homeList = list.filter(f => f.type === 'home');
    assert.strictEqual(homeList.length, 1, 'Only one home favorite can exist');
    assert.strictEqual(homeList[0].name, 'New House');

    // 3. Remove favorite
    const removed = favoriteService.removeFavorite(home2.id);
    assert.strictEqual(removed.id, home2.id);

    const afterRemove = favoriteService.listFavorites();
    assert.strictEqual(afterRemove.some(f => f.id === home2.id), false);
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
