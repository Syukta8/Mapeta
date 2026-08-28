import pathlib

db_ts = """import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'mapeta.sqlite');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

/**
 * Initializes database tables if they don't exist.
 */
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reported_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      icon TEXT DEFAULT 'pin'
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      result_name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_pois (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      address TEXT
    );
  `);

  console.log('[Database] SQLite tables initialized successfully at:', dbPath);
}
"""

ws_ts = """import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export interface WSMessage {
  type: 'INCIDENT_NEW' | 'INCIDENT_UPDATE' | 'INCIDENT_DELETE' | 'PING' | 'PONG' | 'USER_TELEMETRY';
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

    ws.on('message', (messageRaw) => {
      try {
        const msg: WSMessage = JSON.parse(messageRaw.toString());
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
"""

inc_ts = """import { Router } from 'express';
import { db } from '../db/database.js';
import { broadcast } from '../ws/incidentSocket.js';

export const incidentRouter = Router();

export interface Incident {
  id: string;
  type: 'police' | 'hazard' | 'jam' | 'closure' | 'accident';
  lat: number;
  lng: number;
  title: string;
  description?: string;
  reported_at: number;
  expires_at: number;
  upvotes: number;
  downvotes: number;
  active: number;
}

// GET all active incidents
incidentRouter.get('/', (req, res) => {
  try {
    const now = Date.now();
    const rows = db.prepare(`
      SELECT * FROM incidents 
      WHERE active = 1 AND expires_at > ?
      ORDER BY reported_at DESC
    `).all(now) as Incident[];
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST a new incident report
incidentRouter.post('/', (req, res) => {
  try {
    const { id, type, lat, lng, title, description, durationHours = 2 } = req.body;
    if (!type || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required incident fields (type, lat, lng)' });
    }

    const incidentId = id || `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const expiresAt = now + (durationHours * 3600 * 1000);

    const incident: Incident = {
      id: incidentId,
      type,
      lat: Number(lat),
      lng: Number(lng),
      title: title || `${type.toUpperCase()} reported`,
      description: description || '',
      reported_at: now,
      expires_at: expiresAt,
      upvotes: 1,
      downvotes: 0,
      active: 1
    };

    db.prepare(`
      INSERT INTO incidents (id, type, lat, lng, title, description, reported_at, expires_at, upvotes, downvotes, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      incident.id,
      incident.type,
      incident.lat,
      incident.lng,
      incident.title,
      incident.description,
      incident.reported_at,
      incident.expires_at,
      incident.upvotes,
      incident.downvotes,
      incident.active
    );

    // Broadcast new incident to all connected clients immediately
    broadcast({
      type: 'INCIDENT_NEW',
      payload: incident
    });

    res.status(201).json({ success: true, data: incident });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST upvote or downvote an incident
incidentRouter.post('/:id/vote', (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'

    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as Incident | undefined;
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    let upvotes = incident.upvotes;
    let downvotes = incident.downvotes;
    let active = incident.active;

    if (vote === 'up') {
      upvotes += 1;
    } else if (vote === 'down') {
      downvotes += 1;
      // Auto-deactivate if net downvotes exceed threshold
      if (downvotes >= upvotes + 3) {
        active = 0;
      }
    }

    db.prepare('UPDATE incidents SET upvotes = ?, downvotes = ?, active = ? WHERE id = ?')
      .run(upvotes, downvotes, active, id);

    const updated = { ...incident, upvotes, downvotes, active };

    broadcast({
      type: active ? 'INCIDENT_UPDATE' : 'INCIDENT_DELETE',
      payload: updated
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
"""

route_ts = """import { Router } from 'express';

export const routeRouter = Router();

// GET /api/route?start=lng,lat&end=lng,lat&profile=driving|bike|foot&alternatives=true
routeRouter.get('/', async (req, res) => {
  try {
    const { start, end, profile = 'driving', alternatives = 'true' } = req.query;

    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Start and end coordinates required (format: lng,lat)' });
    }

    const mode = profile === 'bike' ? 'bike' : profile === 'foot' ? 'foot' : 'driving';
    const osrmUrl = `https://routing.openstreetmap.de/routed-${mode}/route/v1/${mode}/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=${alternatives}`;

    const response = await fetch(osrmUrl, {
      headers: {
        'User-Agent': 'Mapeta-Local-Server/1.0',
      },
    });

    if (!response.ok) {
      const fallbackUrl = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&alternatives=${alternatives}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' },
      });
      if (!fallbackRes.ok) {
        throw new Error(`OSRM routing failed with status ${fallbackRes.status}`);
      }
      const data = await fallbackRes.json();
      return res.json({ success: true, data });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[RouteProxy] Routing error:', err);
    res.status(500).json({ success: false, error: err.message || 'Routing calculation failed' });
  }
});
"""

geocode_ts = """import { Router } from 'express';
import { db } from '../db/database.js';

export const geocodeRouter = Router();

const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// GET /api/geocode/search?q=address&limit=5
geocodeRouter.get('/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    const limit = Number(req.query.limit) || 5;

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const cached = searchCache.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    const localMatches = db.prepare(`
      SELECT id, name, category, lat, lng, address as display_name 
      FROM local_pois 
      WHERE name LIKE ? OR address LIKE ?
      LIMIT ?
    `).all(`%${query}%`, `%${query}%`, limit);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Mapeta-Local-Server/1.0',
        'Accept-Language': 'en',
      },
    });

    let externalResults: any[] = [];
    if (response.ok) {
      externalResults = await response.json();
    }

    const combined = [...localMatches, ...externalResults].slice(0, limit);
    searchCache.set(query.toLowerCase(), { data: combined, timestamp: Date.now() });

    res.json({ success: true, data: combined });
  } catch (err: any) {
    console.error('[GeocodeProxy] Search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/geocode/reverse?lat=x&lng=y
geocodeRouter.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude required' });
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Mapeta-Local-Server/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[GeocodeProxy] Reverse geocode error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
"""

idx_ts = """import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import { initWebSocketServer } from './ws/incidentSocket.js';
import { incidentRouter } from './routes/incidentRoutes.js';
import { routeRouter } from './routes/routeProxy.js';
import { geocodeRouter } from './routes/geocodeProxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 3000;

// Initialize Database & WebSocket Hub
initDatabase();
initWebSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/incidents', incidentRouter);
app.use('/api/route', routeRouter);
app.use('/api/geocode', geocodeRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Mapeta',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// Serve frontend static build in production
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('=========================================');
  console.log(`Mapeta Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket endpoint: ws://0.0.0.0:${PORT}/ws`);
  console.log('=========================================');
});
"""

pathlib.Path('server/db').mkdir(parents=True, exist_ok=True)
pathlib.Path('server/ws').mkdir(parents=True, exist_ok=True)
pathlib.Path('server/routes').mkdir(parents=True, exist_ok=True)

pathlib.Path('server/db/database.ts').write_text(db_ts, encoding='utf-8')
pathlib.Path('server/ws/incidentSocket.ts').write_text(ws_ts, encoding='utf-8')
pathlib.Path('server/routes/incidentRoutes.ts').write_text(inc_ts, encoding='utf-8')
pathlib.Path('server/routes/routeProxy.ts').write_text(route_ts, encoding='utf-8')
pathlib.Path('server/routes/geocodeProxy.ts').write_text(geocode_ts, encoding='utf-8')
pathlib.Path('server/index.ts').write_text(idx_ts, encoding='utf-8')
print('Successfully generated all server files!')