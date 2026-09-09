/**
 * Application environment & runtime configuration.
 *
 * Precedence Chain:
 * 1. Runtime override via localStorage.getItem('mapeta_api_base') (allows updating tunnel URL without redeploy)
 * 2. Build-time default via import.meta.env.VITE_API_URL
 * 3. '' (same-origin relative paths for local hosting)
 */

export const STORAGE_KEY_API_BASE = 'mapeta_api_base';

/**
 * Reads any user-configured runtime API base from localStorage.
 */
export function getRuntimeApiBase(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const override = window.localStorage.getItem(STORAGE_KEY_API_BASE);
      if (override && override.trim()) {
        return override.trim().replace(/\/$/, '');
      }
    } catch {
      // localStorage may be unavailable in restricted environments
    }
  }
  return '';
}

/**
 * Sets or clears the runtime API base URL.
 */
export function setRuntimeApiBase(url: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cleaned = url.trim().replace(/\/$/, '');
      if (cleaned) {
        window.localStorage.setItem(STORAGE_KEY_API_BASE, cleaned);
      } else {
        window.localStorage.removeItem(STORAGE_KEY_API_BASE);
      }
    } catch {
      // Ignore storage write failures
    }
  }
}

/**
 * Removes the runtime API base override from localStorage.
 */
export function clearRuntimeApiBase(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_API_BASE);
    } catch {
      // Ignore
    }
  }
}

/**
 * Resolves the active API base URL following the documented precedence chain.
 */
export function getApiBase(): string {
  const runtime = getRuntimeApiBase();
  if (runtime) return runtime;
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) ||
    '';
  return envUrl.trim().replace(/\/$/, '');
}

/**
 * Backwards-compatible export representing the initial resolved API base.
 */
export const API_BASE: string = getApiBase();

/**
 * Derives the WebSocket URL from the active API base or current window location.
 */
export function getWebSocketUrl(): string {
  const base = getApiBase();
  if (base) {
    try {
      const url = new URL(base);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${url.host}/ws`;
    } catch {
      // Fallback if URL parsing fails
    }
  }
  const protocol = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location?.host : 'localhost:3000';
  return `${protocol}//${host}/ws`;
}
