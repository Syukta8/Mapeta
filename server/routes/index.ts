import { Router } from 'express';
import { incidentRouter } from './incidentRoutes.js';
import { favoritesRouter } from './favoriteRoutes.js';
import { geocodeRouter } from './geocodeRoutes.js';
import { routeRouter } from './routeRoutes.js';
import { tilesRouter } from './tileRoutes.js';
import * as healthController from '../controllers/healthController.js';

export const apiRouter = Router();

apiRouter.use('/incidents', incidentRouter);
apiRouter.use('/route', routeRouter);
apiRouter.use('/geocode', geocodeRouter);
apiRouter.use('/favorites', favoritesRouter);
apiRouter.use('/tiles', tilesRouter);
apiRouter.get('/health', healthController.getHealth);
