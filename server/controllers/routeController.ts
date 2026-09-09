import * as routeService from '../services/routeService.js';
import type { Request, Response } from 'express';

/**
 * Calculate route
 */
export const getRoute = async (req: Request, res: Response) => {
    try {
        const start = req.query.start as string;
        const end = req.query.end as string;
        const profile = (req.query.profile as string) || 'driving';
        
        if (!start || !end) {
            return res.status(400).json({ success: false, error: 'Missing start or end coordinates' });
        }
        
        const data = await routeService.calculateRoutes(start, end, profile);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};
