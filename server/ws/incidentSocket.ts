import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

import * as incidentModel from '../models/incidentModel.js';

export interface WSMessage {
  type: 'INCIDENT_SNAPSHOT' | 'INCIDENT_NEW' | 'INCIDENT_UPDATE' | 'INCIDENT_DELETE' | 'PING' | 'PONG' | 'USER_TELEMETRY' | 'CONNECTED';
  payload: any;
}

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

/**
 * Initializes WebSocket server on top of HTTP server.
 */
export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'CONNECTED', payload: { timestamp: Date.now() } }));

    // Send active incidents snapshot immediately upon connection
    try {
      const active = incidentModel.findActive(Date.now());
      ws.send(JSON.stringify({ type: 'INCIDENT_SNAPSHOT', payload: active }));
    } catch (e) {
      console.error('[WebSocket] Failed to send initial snapshot:', e);
    }

    ws.on('message', (messageRaw) => {
      try {
        const msg = JSON.parse(messageRaw.toString());
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', payload: { timestamp: Date.now() } }));
        } else if (msg.type === 'USER_TELEMETRY') {
          broadcast(msg, ws);
        }
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err);
      clients.delete(ws);
    });
  });

  console.log('[WebSocket] Real-time incident hub initialized on /ws');
}

/**
 * Broadcasts an event to all connected clients.
 * @param message The message to send.
 * @param exclude Optional client to exclude from broadcast.
 */
export function broadcast(message: WSMessage, exclude?: WebSocket) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}
