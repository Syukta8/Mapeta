import { Router } from 'express';
import * as favoriteController from '../controllers/favoriteController.js';

export const favoritesRouter = Router();
favoritesRouter.get('/', favoriteController.getAll);
favoritesRouter.post('/', favoriteController.create);
favoritesRouter.delete('/:id', favoriteController.remove);
