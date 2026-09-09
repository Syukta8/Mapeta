import { Router } from 'express';
import * as geocodeController from '../controllers/geocodeController.js';

export const geocodeRouter = Router();
geocodeRouter.get('/search', geocodeController.search);
geocodeRouter.get('/reverse', geocodeController.reverse);
