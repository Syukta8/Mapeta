import './helpers/setupEnv.js';
import { setupTestDb, clearTestDb } from './helpers/testDb.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as incidentService from '../services/incidentService.js';
import * as tileService from '../services/tileService.js';
import { getStatement } from '../db/database.js';

describe('Milestone 1: Malaysia Incident Reporting & Pipeline Tests', () => {
  beforeEach(() => {
    setupTestDb();
    clearTestDb();
  });

  describe('Malaysia Coverage & Bounds Validation', () => {
    it('accepts valid coordinates in Peninsular Malaysia (Kuala Lumpur)', () => {
      const { incident, isDuplicate } = incidentService.reportIncident({
        type: 'accident',
        subtype: 'Major Accident',
        lat: 3.139,
        lng: 101.6869,
        accuracy: 12.5,
      });

      assert.strictEqual(isDuplicate, false);
      assert.strictEqual(incident.type, 'accident');
      assert.strictEqual(incident.subtype, 'Major Accident');
      assert.strictEqual(incident.accuracy, 12.5);
      assert.strictEqual(incident.title, 'Accident: Major Accident');
      assert.strictEqual(incident.status, 'active');
    });

    it('accepts valid coordinates in East Malaysia (Kota Kinabalu, Sabah)', () => {
      const { incident } = incidentService.reportIncident({
        type: 'hazard',
        subtype: 'Road Works',
        lat: 5.9804,
        lng: 116.0735,
      });

      assert.strictEqual(incident.type, 'hazard');
      assert.strictEqual(incident.title, 'Hazard: Road Works');
    });

    it('accepts valid coordinates in Sarawak (Kuching)', () => {
      const { incident } = incidentService.reportIncident({
        type: 'jam',
        lat: 1.5533,
        lng: 110.3592,
      });

      assert.strictEqual(incident.type, 'jam');
      assert.strictEqual(incident.title, 'Jam reported');
    });

    it('rejects coordinates outside Malaysia boundaries', () => {
      // London, UK
      assert.throws(() => {
        incidentService.reportIncident({
          type: 'police',
          lat: 51.5074,
          lng: -0.1278,
        });
      }, /outside Malaysia coverage area/i);

      // Tokyo, Japan
      assert.throws(() => {
        incidentService.reportIncident({
          type: 'accident',
          lat: 35.6762,
          lng: 139.6503,
        });
      }, /outside Malaysia coverage area/i);
    });
  });

  describe('Idempotency & Deduplication', () => {
    it('deduplicates retry submissions matching the same idempotency_key', () => {
      const idempotencyKey = 'retry-key-uuid-12345';

      const first = incidentService.reportIncident({
        type: 'accident',
        lat: 3.14,
        lng: 101.69,
        idempotency_key: idempotencyKey,
      });
      assert.strictEqual(first.isDuplicate, false);

      const second = incidentService.reportIncident({
        type: 'accident',
        lat: 3.14,
        lng: 101.69,
        idempotency_key: idempotencyKey,
      });

      assert.strictEqual(second.isDuplicate, true);
      assert.strictEqual(second.incident.id, first.incident.id);

      // Verify only 1 incident exists in database
      const countRow = getStatement('SELECT COUNT(*) as count FROM incidents').get() as { count: number };
      assert.strictEqual(countRow.count, 1);
    });
  });

  describe('Incident Lifecycle (Resolve & Expiry)', () => {
    it('resolves an incident and marks it inactive', () => {
      const { incident } = incidentService.reportIncident({
        type: 'closure',
        lat: 3.2,
        lng: 101.7,
      });

      const resolved = incidentService.resolveIncident(incident.id);
      assert.strictEqual(resolved.status, 'resolved');
      assert.strictEqual(resolved.active, 0);

      const activeList = incidentService.getActiveIncidents();
      assert.strictEqual(activeList.some((i) => i.id === incident.id), false);
    });
  });

  describe('Tile Service Metadata & Range Requests', () => {
    it('exposes tile metadata with coverage and bounds', () => {
      const meta = tileService.getTileMetadata();
      assert.strictEqual(meta.coverage, 'Malaysia (Peninsular, Sabah, Sarawak)');
      assert.deepStrictEqual(meta.bounds, [99.5, 0.8, 119.5, 7.5]);
      assert.strictEqual(meta.format, 'pmtiles');
    });

    it('returns 404 cleanly when offline map file is absent', () => {
      // Malaysia.pmtiles is not committed to git (offline asset)
      const res = tileService.streamTiles('bytes=0-1024');
      assert.strictEqual(res, null);

      const head = tileService.headTiles();
      assert.strictEqual(head, null);
    });
  });
});
