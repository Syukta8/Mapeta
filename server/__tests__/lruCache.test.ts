import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LRUCache } from '../utils/LRUCache.js';

describe('LRUCache Utility', () => {
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

    // Access k1 to promote it (now k2 is the oldest)
    assert.strictEqual(cache.get('k1'), 'v1');

    // Adding k4 should evict k2
    cache.set('k4', 'v4');

    assert.strictEqual(cache.get('k2'), undefined, 'k2 should have been evicted');
    assert.strictEqual(cache.get('k1'), 'v1', 'k1 should still exist');
    assert.strictEqual(cache.get('k3'), 'v3', 'k3 should still exist');
    assert.strictEqual(cache.get('k4'), 'v4', 'k4 should still exist');
    assert.strictEqual(cache.size, 3);
  });

  it('expires items past their TTL', async () => {
    const cache = new LRUCache<string, string>(3, 50); // 50ms TTL
    cache.set('temp', 'val');

    assert.strictEqual(cache.get('temp'), 'val');

    await new Promise((resolve) => setTimeout(resolve, 70));

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
