import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './db/database.js';
import { initWebSocketServer } from './ws/incidentSocket.js';
import { apiRouter } from './routes/index.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Security headers with relaxed CSP/COEP for MapLibre WebGL workers & vector tiles
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS origin filter: allows localhost, private LAN IPs, and Cloudflare Pages
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.pages.dev') ||
      /^https?:\/\/(192\.168|10|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
}));

// Rate limiting: 120 requests per minute per IP on /api routes
app.use('/api', rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please try again in a minute.' },
}));

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
