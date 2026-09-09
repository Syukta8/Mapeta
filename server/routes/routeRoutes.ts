import { Router } from 'express';
import * as routeController from '../controllers/routeController.js';

export const routeRouter = Router();
routeRouter.get('/', routeController.getRoute);
