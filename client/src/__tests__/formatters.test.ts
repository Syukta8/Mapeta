import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatManeuverDistance, formatNavigationDuration, formatTollCurrency } from '../utils/formatters.js';

describe('Formatters (Presentation Helpers)', () => {
  test('formats distances correctly under and over 1km', () => {
    assert.strictEqual(formatManeuverDistance(450), '450 m');
    assert.strictEqual(formatManeuverDistance(1500), '1.5 km');
    assert.strictEqual(formatManeuverDistance(10000), '10.0 km');
  });

  test('formats durations in minutes and hours', () => {
    assert.strictEqual(formatNavigationDuration(300), '5 min');
    assert.strictEqual(formatNavigationDuration(3900), '1 hr 5 min');
    assert.strictEqual(formatNavigationDuration(7200), '2 hr 0 min');
  });

  test('formats toll currency accurately', () => {
    assert.strictEqual(formatTollCurrency(0), 'Toll-Free');
    assert.strictEqual(formatTollCurrency(7.6), 'RM 7.60');
    assert.strictEqual(formatTollCurrency(14.25), 'RM 14.25');
  });
});
