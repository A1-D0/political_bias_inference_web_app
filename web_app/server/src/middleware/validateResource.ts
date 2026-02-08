import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

const validateResource = (schema: ZodTypeAny) => 
(req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body, 
            params: req.params, 
            query: req.query
        });
        next();
    } catch (error) {
        return res.status(400).json({ error: 'Invalid request data' });
    }
};

export default validateResource;
