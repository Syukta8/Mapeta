import * as tileService from '../services/tileService.js';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Get tile server status
 */
export const getStatus = asyncHandler(async (_req: Request, res: Response) => {
  const status = tileService.getOfflineStatus();
  res.json({ success: true, ...status });
});

/**
 * Get tile metadata (coverage, bounds, zoom levels, format)
 */
export const getMetadata = asyncHandler(async (_req: Request, res: Response) => {
  const metadata = tileService.getTileMetadata();
  res.json({ success: true, data: metadata });
});

/**
 * Stream a tile with Range and HEAD support
 */
export const streamTile = asyncHandler(async (req: Request, res: Response) => {
  if (req.method === 'HEAD') {
    const head = tileService.headTiles();
    if (!head) {
      res.status(404).end();
      return;
    }
    res.writeHead(head.statusCode, head.headers);
    res.end();
    return;
  }

  const rangeHeader = req.headers.range;
  const result = tileService.streamTiles(rangeHeader);

  if (!result) {
    res.status(404).json({ success: false, error: 'Tile not found' });
    return;
  }

  res.writeHead(result.statusCode, result.headers);
  if (result.stream) {
    result.stream.pipe(res);
  } else {
    res.end();
  }
});

