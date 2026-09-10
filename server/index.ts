import http from 'http';
import { app } from './app.js';
import { initWebSocketServer } from './ws/incidentSocket.js';

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSocket Hub
initWebSocketServer(server);

process.on('uncaughtException', (err) => {
  console.error('[Mapeta UncaughtException]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Mapeta UnhandledRejection]', reason);
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Mapeta] Server listening on http://127.0.0.1:${PORT}`);
});
