import * as favoriteService from '../services/favoriteService.js';
import type { Request, Response } from 'express';

/**
 * Get all favorites
 */
export const getAll = (_req: Request, res: Response) => {
  try {
    const data = favoriteService.listFavorites();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a favorite
 */
export const create = (req: Request, res: Response) => {
  try {
    const data = favoriteService.saveFavorite(req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Remove a favorite by ID
 */
export const remove = (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    favoriteService.removeFavorite(id);
    res.json({ success: true, data: { id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
