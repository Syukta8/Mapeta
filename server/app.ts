import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './db/database.js';
import { purgeExpiredIncidents } from './services/incidentService.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

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

// Rate limiting: 120 requests per minute per IP on /api routes (bypassed in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Rate limit exceeded. Please try again in a minute.' },
  }));
}

app.use(express.json());

// Initialize SQLite DB
initDatabase();

// Scheduled maintenance: purge expired incidents every 5 minutes to prevent DB bloat
if (process.env.NODE_ENV !== 'test') {
  const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
  setInterval(() => {
    try {
      const purged = purgeExpiredIncidents();
      if (purged > 0) {
        console.log(`[Maintenance] Purged ${purged} expired incident(s)`);
      }
    } catch (err) {
      console.error('[Maintenance] Error purging expired incidents:', err);
    }
  }, CLEANUP_INTERVAL_MS).unref();
}

// API Routes (central aggregator)
app.use('/api', apiRouter);

// Centralized API Error Handling Middleware
app.use(errorHandler);

// Static Client Files
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
