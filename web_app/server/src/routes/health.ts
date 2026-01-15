/*
    * Health Check Module
    * This module provides a simple health check endpoint for the application. 
    * It responds with a JSON object indicating the service status.
*/

import { Request, Response } from 'express';
import { HealthResponse } from '../../../shared/schemas/health';

/**
    * Health Check Handler
    * Responds with the health status of the service.
    *
    * @param req - Express Request object
    * @param res - Express Response object
    * @return response with health status information
*/
export const healthCheck = (req: Request, res: Response) => {
    const payload: HealthResponse = {
        status: "ok",
        service: "healthy",
        timestamp: new Date().toISOString(),
        uptime_seconds: process.uptime(),
    };
    res.status(200).send(payload);
}
