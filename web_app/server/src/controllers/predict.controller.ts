import { Request, Response } from 'express';
import logger from '../utils/logger.utils'
import { MLInferenceRequest, 
    MLInferenceResponseSchema } from '@usnewsweb/shared/schemas/MLInference';
import { predictService } from '../services/predict.service'; 

type RequestWithId = Request & {
    requestId?: string;
};

export async function predictController(
    req: RequestWithId & Request<{}, {}, MLInferenceRequest>, 
    res: Response
) {
    try {
        const text = req.body; 
        const payload = await predictService(text, req.requestId);

        if (MLInferenceResponseSchema.safeParse(payload).success === false) {
            logger.error({
                service: 'backend-api',
                event: 'invalid_prediction_response',
                request_id: req.requestId || 'unknown',
                payload_keys: payload && typeof payload === 'object'
                    ? Object.keys(payload)
                    : [],
            });
            return res.status(500).json({ error: 'Invalid prediction response format' });
        }

        return res.status(200).json(payload);
    } catch (error: any) {
        logger.error({
            service: 'backend-api',
            event: 'predict_controller_error',
            request_id: req.requestId || 'unknown',
            err: error,
            code: error?.code,
        });
        return res.status(502).json({ error: 'Bad Gateway Error' });
    }
}
