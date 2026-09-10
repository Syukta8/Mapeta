import * as favoriteService from '../services/favoriteService.js';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Get all favorites
 */
export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const data = favoriteService.listFavorites();
  res.json({ success: true, data });
});

/**
 * Create a favorite
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = favoriteService.saveFavorite(req.body);
  res.json({ success: true, data });
});

/**
 * Remove a favorite by ID
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  favoriteService.removeFavorite(id);
  res.json({ success: true, data: { id } });
});
