import { Express } from 'express';
import indexController from '../controllers/index.controller';
import { healthCheck } from './health';
import { predictController } from '../controllers/predict.controller';
import validateResource from '../middleware/validateResource';
import { MLInferenceRequestSchema } from '@usnewsweb/shared/schemas/MLInference';

/**
    * Routes Module
    * This module defines the routes for the Express application.
    *
    * @param app - Express application instance
*/
function routes(app: Express) {
    app.get('/', indexController);

    app.get('/health', healthCheck);

    app.post('/predict', validateResource(MLInferenceRequestSchema), predictController);
};

export default routes;
