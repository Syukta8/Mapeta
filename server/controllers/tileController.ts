import * as tileService from '../services/tileService.js';
import type { Request, Response } from 'express';

/**
 * Get tile server status
 */
export const getStatus = (req: Request, res: Response) => {
    try {
        const status = tileService.getOfflineStatus();
        res.json({ success: true, ...status });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Stream a tile
 */
export const streamTile = (req: Request, res: Response) => {
    try {
        const rangeHeader = req.headers.range;
        const result = tileService.streamTiles(rangeHeader);
        
        if (!result) {
            return res.status(404).json({ success: false, error: 'Tile not found' });
        }
        
        res.writeHead(result.statusCode, result.headers);
        result.stream.pipe(res);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};
