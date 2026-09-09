import { Router } from 'express';
import * as tileController from '../controllers/tileController.js';

export const tilesRouter = Router();
tilesRouter.get('/status', tileController.getStatus);
tilesRouter.get('/malaysia.pmtiles', tileController.streamTile);
