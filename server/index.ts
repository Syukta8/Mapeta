import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import { initWebSocketServer } from './ws/incidentSocket.js';
import { apiRouter } from './routes/index.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite DB
initDatabase();

// Initialize WebSocket Hub
initWebSocketServer(server);

// API Routes (central aggregator)
app.use('/api', apiRouter);

// Static Client Files
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

process.on('uncaughtException', (err) => {
  console.error('[Mapeta UncaughtException]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Mapeta UnhandledRejection]', reason);
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Mapeta] Server listening on http://127.0.0.1:${PORT}`);
});
