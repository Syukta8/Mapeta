/**
 * Application environment configuration.
 * When deployed to Cloudflare Pages, VITE_API_URL points to the backend (e.g., Cloudflare tunnel URL).
 * In local same-origin mode, VITE_API_URL is empty and API calls default to relative paths.
 */
export const API_BASE: string = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Derives the WebSocket URL.
 * If API_BASE is set, transforms http(s) into ws(s) against the remote origin.
 * Otherwise, falls back to the current window location.
 */
export function getWebSocketUrl(): string {
  if (API_BASE) {
    try {
      const url = new URL(API_BASE);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${url.host}/ws`;
    } catch {
      // If parsing fails, fall back to window.location
    }
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}
