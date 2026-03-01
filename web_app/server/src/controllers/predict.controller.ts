import { Request, Response } from 'express';
import logger from '../utils/logger.utils'
import { MLInferenceRequest, 
    MLInferenceResponseSchema } from '@usnewsweb/shared/schemas/MLInference';
import { predictService } from '../services/predict.service'; 

export async function predictController(
    req: Request<{}, {}, MLInferenceRequest>, 
    res: Response
) {
    try {
        const text = req.body; 
        const payload = await predictService(text);

        if (MLInferenceResponseSchema.safeParse(payload).success === false) {
            logger.error({ payload }, 'Invalid prediction response format');
            return res.status(500).json({ error: 'Invalid prediction response format' });
        }

        return res.status(200).json(payload);
    } catch (error: any) {
        logger.error({err: error, code: error?.code}, 'Error in predict controller');
        return res.status(502).json({ error: 'Bad Gateway Error' });
    }
}
