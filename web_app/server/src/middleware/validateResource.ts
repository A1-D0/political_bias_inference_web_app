import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
import logger from '../utils/logger.utils';

type RequestWithId = Request & {
    requestId?: string;
};

const validateResource = (schema: ZodTypeAny) => 
(req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body, 
            params: req.params, 
            query: req.query
        });
        next();
    } catch (error: any) {
        const request = req as RequestWithId;

        logger.error({
            service: 'backend-api',
            event: 'request_validation_failed',
            request_id: request.requestId || res.locals.requestId || 'unknown',
            route: req.originalUrl || req.path || 'unknown',
            method: req.method,
            status_code: 400,
            validation_errors: Array.isArray(error?.issues)
                ? error.issues
                : error,
            err: {
                type: error?.constructor?.name || error?.name || 'Error',
                message: error?.message || String(error),
                stack: error?.stack,
            },
            msg: 'request validation failed',
        });
        return res.status(400).json({ error: 'Invalid request data' });
    }
};

export default validateResource;
