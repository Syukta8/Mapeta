import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import { initWebSocketServer } from './ws/incidentSocket.js';
import { incidentRouter } from './routes/incidentRoutes.js';
import { routeRouter } from './routes/routeProxy.js';
import { geocodeRouter } from './routes/geocodeProxy.js';
import { favoritesRouter } from './routes/favoritesRouter.js';
import { tilesRouter } from './routes/tilesRouter.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite DB
initDatabase();

// Initialize WebSocket Hub
initWebSocketServer(server);

// API Routes
app.use('/api/incidents', incidentRouter);
app.use('/api/route', routeRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/tiles', tilesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Mapeta', timestamp: Date.now() });
});

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
