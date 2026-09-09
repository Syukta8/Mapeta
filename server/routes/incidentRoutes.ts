import { Router } from 'express';
import * as incidentController from '../controllers/incidentController.js';

export const incidentRouter = Router();
incidentRouter.get('/', incidentController.getAll);
incidentRouter.post('/', incidentController.create);
incidentRouter.post('/:id/vote', incidentController.vote);
