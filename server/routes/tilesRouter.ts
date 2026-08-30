import { Router } from 'express';
import fs from 'fs';
import path from 'path';

export const tilesRouter = Router();

const OFFLINE_MAP_DIR = path.join(process.cwd(), 'server', 'data');
const MALAYSIA_PMTILES_PATH = path.join(OFFLINE_MAP_DIR, 'malaysia.pmtiles');

// GET /api/tiles/status -> Check if offline Malaysia map is downloaded
tilesRouter.get('/status', (_req, res) => {
  const exists = fs.existsSync(MALAYSIA_PMTILES_PATH);
  if (exists) {
    const stats = fs.statSync(MALAYSIA_PMTILES_PATH);
    res.json({
      success: true,
      hasOfflineMap: true,
      filename: 'malaysia.pmtiles',
      sizeBytes: stats.size,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
    });
  } else {
    res.json({
      success: true,
      hasOfflineMap: false,
      message: 'Offline Malaysia map not found. Run "npm run download:map" to fetch offline tiles.',
    });
  }
});

// GET /api/tiles/malaysia.pmtiles -> HTTP 206 Partial Content Byte Range Streaming
tilesRouter.get('/malaysia.pmtiles', (req, res) => {
  if (!fs.existsSync(MALAYSIA_PMTILES_PATH)) {
    return res.status(404).json({ success: false, error: 'Offline Malaysia map not found on server.' });
  }

  const stat = fs.statSync(MALAYSIA_PMTILES_PATH);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(MALAYSIA_PMTILES_PATH, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    });
    fs.createReadStream(MALAYSIA_PMTILES_PATH).pipe(res);
  }
});
