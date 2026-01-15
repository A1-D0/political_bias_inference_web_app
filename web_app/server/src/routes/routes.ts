import { healthCheck } from './health';
import { Express } from 'express';

/**
    * Routes Module
    * This module defines the routes for the Express application.
    *
    * @param app - Express application instance
*/
function routes(app: Express) {
    app.get('/health', healthCheck);
};

export default routes;
