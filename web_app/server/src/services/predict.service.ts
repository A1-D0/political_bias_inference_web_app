import { MLInferenceRequest, 
    MLInferenceResponse } from '@usnewsweb/shared/schemas/MLInference';
import predictModel from '../utils/PredictClass'

/*
    * Service function to handle prediction requests.
    * @param {MLInferenceRequest} text - The input text data for prediction.
    * @returns {Promise<typeof MLInferenceResponseSchema>} - The prediction result.
*/
export async function predictService(text: MLInferenceRequest): Promise<MLInferenceResponse | false> {
    const result = await predictModel.predict(text);
    return result;
}
