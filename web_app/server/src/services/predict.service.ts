/*
    * Description:
    * This service module forwards prediction requests from the controller to
    * the backend ML client while preserving the request ID used for
    * structured cross-service logging.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: April 24, 2026
    * Date Modified: April 24, 2026
    * References: Copilot, ChatGPT
*/
import { MLInferenceRequest, 
    MLInferenceResponse } from '@usnewsweb/shared/schemas/MLInference';
import predictModel from '../utils/PredictClass'

/*
    * Service function to handle prediction requests.
    * @param {MLInferenceRequest} text - The input text data for prediction.
    * @returns {Promise<typeof MLInferenceResponseSchema>} - The prediction result.
*/
export async function predictService(
    text: MLInferenceRequest,
    requestId?: string
): Promise<MLInferenceResponse | false> {
    const result = await predictModel.predict(text, requestId);
    return result;
}
