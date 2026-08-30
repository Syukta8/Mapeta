import { test, describe } from 'node:test';
import assert from 'node:assert';
import { detectPlaceCategory } from '../models/SearchModel.js';

describe('SearchModel Category Detection', () => {
  test('detects petrol stations', () => {
    assert.strictEqual(detectPlaceCategory('fuel', 'Petronas Subang Jaya').type, 'petrol');
    assert.strictEqual(detectPlaceCategory(undefined, 'Shell Federal Highway').type, 'petrol');
  });

  test('detects shopping malls', () => {
    assert.strictEqual(detectPlaceCategory('mall', 'Sunway Pyramid').type, 'mall');
    assert.strictEqual(detectPlaceCategory(undefined, 'Suria KLCC').type, 'mall');
  });

  test('detects hospitals and transit hubs', () => {
    assert.strictEqual(detectPlaceCategory('medical', 'Hospital Kuala Lumpur').type, 'hospital');
    assert.strictEqual(detectPlaceCategory('station', 'KL Sentral LRT Station').type, 'transit');
    assert.strictEqual(detectPlaceCategory('aerodrome', 'KLIA Terminal 1').type, 'airport');
  });

  test('defaults to general for unclassified locations', () => {
    assert.strictEqual(detectPlaceCategory(undefined, 'Jalan Tempua 2').type, 'general');
  });
});
