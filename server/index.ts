import express from 'express';
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
