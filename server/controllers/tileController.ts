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
 * Stream a tile
 */
export const streamTile = asyncHandler(async (req: Request, res: Response) => {
  const rangeHeader = req.headers.range;
  const result = tileService.streamTiles(rangeHeader);

  if (!result) {
    res.status(404).json({ success: false, error: 'Tile not found' });
    return;
  }

  res.writeHead(result.statusCode, result.headers);
  result.stream.pipe(res);
});
