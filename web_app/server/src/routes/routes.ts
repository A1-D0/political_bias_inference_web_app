import { Express } from 'express';
import { healthCheck } from './health';
import { predictController } from '../controllers/predict.controller';
import validateResource from '../middleware/validateResource';
import { MLInferenceRequestSchema } from '../../../shared/schemas/MLInference';

/**
    * Routes Module
    * This module defines the routes for the Express application.
    *
    * @param app - Express application instance
*/
function routes(app: Express) {
    app.get('/health', healthCheck);

    app.post('/predict', validateResource(MLInferenceRequestSchema), predictController);
};

export default routes;
