import { MLInferenceRequest, 
    MLInferenceResponse } from '@usnewsweb/shared/schemas/MLInference';
import logger from '../utils/logger.utils'

class PredictModel {

    private inferenceURL: string;
    private APIKey: string;

    /*
        * Constructor for PredictModel.
        * @param {string} inferenceURL - The URL of the ML inference API.
        * @param {string} APIKey - The ML predict API key for authentication.
    */
    constructor(inferenceURL: string, APIKey: string) {
        this.inferenceURL = inferenceURL;
        this.APIKey = APIKey;
    }

    /*
        * Perform prediction on text input data.
        * @param {MLInferenceRequest} text - The input text data for prediction.
        * @returns {Promise<typeof MLInferenceResponseSchema>} - The prediction result.
        * @throws {Error} - Throws an error if the prediction fails.
    */
    async predict(text: MLInferenceRequest): Promise<MLInferenceResponse | false> {
        if (!text) return false;

        try {
            const result = await fetch(`${this.inferenceURL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "X-Internal-API-Key": this.APIKey,
                },
                body: JSON.stringify(text)
            });

            const data = await result.json();

            if (!data || !data.prediction) return false;

            const deliverable = { 
                prediction: data.prediction 
            } satisfies MLInferenceResponse;

            return deliverable; 
        } catch (error: any) {
            logger.error({err: error, code: error?.code}, 'Error during prediction');
            throw error;
        }
    }
}

export default PredictModel;
