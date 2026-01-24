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
        const prediction = await predictService(text);
       
        if (MLInferenceResponseSchema.safeParse(prediction).success === false) {
            logger.error({ prediction }, 'Invalid prediction response format');
            return res.status(500).json({ error: 'Invalid prediction response format' });
        }

        return res.status(200).json(prediction);
    } catch (error: any) {
        logger.error({err: error, code: error?.code}, 'Error in predict controller');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
