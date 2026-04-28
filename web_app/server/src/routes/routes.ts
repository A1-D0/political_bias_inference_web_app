import { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import indexController from '../controllers/index.controller';
import { healthCheck } from './health';
import { predictController } from '../controllers/predict.controller';
import validateResource from '../middleware/validateResource';
import { MLInferenceRequestSchema } from '@usnewsweb/shared/schemas/MLInference';
import { rateLimiter } from '../middleware/rateLimiter';

function predictionUI(_req: Request, res: Response) {
    const publicDir = path.join(process.cwd(), 'public');
    const html = fs.readFileSync(path.join(publicDir, 'public.html'), 'utf8');
    const css = fs.readFileSync(path.join(publicDir, 'public.css'), 'utf8');
    const script = fs.readFileSync(path.join(publicDir, 'public.ts'), 'utf8');

    return res.status(200).send(
        html
            .replace('{{PUBLIC_CSS}}', css)
            .replace('{{PUBLIC_SCRIPT}}', script)
    );
}

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
