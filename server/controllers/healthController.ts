import type { Request, Response } from 'express';

/**
 * Health check endpoint
 */
export const getHealth = (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        app: 'Mapeta',
        timestamp: Date.now()
    });
};
