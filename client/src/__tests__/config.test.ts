import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getApiBase,
  getRuntimeApiBase,
  setRuntimeApiBase,
  clearRuntimeApiBase,
  getWebSocketUrl,
  STORAGE_KEY_API_BASE
} from '../config';

describe('Config & API Precedence Tests', () => {
  // Mock localStorage for Node test runner
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) || null,
    setItem: (key: string, value: string) => storageMap.set(key, value),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  };

  beforeEach(() => {
    storageMap.clear();
    (globalThis as any).window = {
      localStorage: mockLocalStorage,
      location: { protocol: 'https:', host: 'mapeta.pages.dev' }
    };
  });

  it('defaults to empty string when no localStorage override exists', () => {
    assert.strictEqual(getRuntimeApiBase(), '');
  });

  it('stores and reads runtime API override, stripping trailing slashes', () => {
    setRuntimeApiBase('https://mapeta-tunnel.trycloudflare.com/');
    assert.strictEqual(mockLocalStorage.getItem(STORAGE_KEY_API_BASE), 'https://mapeta-tunnel.trycloudflare.com');
    assert.strictEqual(getRuntimeApiBase(), 'https://mapeta-tunnel.trycloudflare.com');
    assert.strictEqual(getApiBase(), 'https://mapeta-tunnel.trycloudflare.com');
  });

  it('clears runtime API override', () => {
    setRuntimeApiBase('https://temp.trycloudflare.com');
    assert.strictEqual(getApiBase(), 'https://temp.trycloudflare.com');

    clearRuntimeApiBase();
    assert.strictEqual(getRuntimeApiBase(), '');
  });

  it('derives secure wss:// WebSocket URL from https:// API base', () => {
    setRuntimeApiBase('https://remote-subdomain.trycloudflare.com');
    const wsUrl = getWebSocketUrl();
    assert.strictEqual(wsUrl, 'wss://remote-subdomain.trycloudflare.com/ws');
  });

  it('derives insecure ws:// WebSocket URL from http:// API base', () => {
    setRuntimeApiBase('http://192.168.1.100:3000');
    const wsUrl = getWebSocketUrl();
    assert.strictEqual(wsUrl, 'ws://192.168.1.100:3000/ws');
  });

  it('falls back to window.location when no API base is set', () => {
    clearRuntimeApiBase();
    const wsUrl = getWebSocketUrl();
    assert.strictEqual(wsUrl, 'wss://mapeta.pages.dev/ws');
  });
});
