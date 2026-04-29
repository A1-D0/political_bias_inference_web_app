import { Express } from 'express';
import indexController from '../controllers/index.controller';
import { healthCheck } from './health';
import { predictController } from '../controllers/predict.controller';
import validateResource from '../middleware/validateResource';
import { MLInferenceRequestSchema } from '@usnewsweb/shared/schemas/MLInference';
import { rateLimiter } from '../middleware/rateLimiter';
import { predictionUI } from './predictUI';

/**
    * Routes Module
    * This module defines the routes for the Express application.
    *
    * @param app - Express application instance
*/
function routes(app: Express) {
    app.get('/', indexController);

    app.get('/health', healthCheck);

    app.get('/predict', predictionUI);

    app.post('/api/predict',
             rateLimiter, validateResource(MLInferenceRequestSchema), 
             predictController);
};

export default routes;
