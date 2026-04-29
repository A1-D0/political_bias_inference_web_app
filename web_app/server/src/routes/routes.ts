import { Express } from 'express';
import indexController from '../controllers/index.controller';
import { healthCheck } from './health';
import { predictController } from '../controllers/predict.controller';
import validateResource from '../middleware/validateResource';
import { MLInferenceRequestSchema } from '@usnewsweb/shared/schemas/MLInference';
import { rateLimiter } from '../middleware/rateLimiter';
import { predictionUI } from './predictUI';

/*
    * Register application routes.
    * API routes:
    * GET /predict - Serves the prediction UI.
    * POST /api/predict - Accepts article text and returns prediction results.
    * @param {Express} app - Express application instance where routes are mounted.
    * @returns {void}
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
