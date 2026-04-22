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
        * @param {string} requestId - Optional request ID to correlate backend and ML service logs.
        * @returns {Promise<typeof MLInferenceResponseSchema>} - The prediction result.
        * @throws {Error} - Throws an error if the prediction fails.
    */
    async predict(text: MLInferenceRequest, requestId?: string): Promise<MLInferenceResponse | false> {
        if (!text) return false;

        const fetchStartedAt = process.hrtime.bigint();
        let responseReceivedAt: bigint | undefined;

        try {
            const result = await fetch(`${this.inferenceURL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "X-Internal-API-Key": this.APIKey,
                    ...(requestId ? { 'X-Request-Id': requestId } : {}),
                },
                body: JSON.stringify(text)
            });
            responseReceivedAt = process.hrtime.bigint();

            const data = await result.json();
            const completedAt = process.hrtime.bigint();
            // network_time_ms ends at response headers; upstream_latency_ms includes JSON parsing.
            const upstreamLatencyMs = Number(completedAt - fetchStartedAt) / 1_000_000;
            const networkTimeMs = Number(responseReceivedAt - fetchStartedAt) / 1_000_000;

            logger.info({
                service: 'backend-api',
                event: 'upstream_call_completed',
                request_id: requestId || 'unknown',
                upstream_service: 'ml-service',
                upstream_route: '/predict',
                upstream_status_code: result.status,
                upstream_latency_ms: Number(upstreamLatencyMs.toFixed(3)),
                network_time_ms: Number(networkTimeMs.toFixed(3)),
                timeout: false,
            });

            if (!data || !data.prediction) return false;

            const deliverable = { 
                prediction: data.prediction,
                model_version: data.model_version || 'unknown',
                label_encoder_version: data.label_encoder_version || 'unknown',
            } satisfies MLInferenceResponse;

            return deliverable; 
        } catch (error: any) {
            const completedAt = process.hrtime.bigint();
            const upstreamLatencyMs = Number(completedAt - fetchStartedAt) / 1_000_000;
            const timeout = error?.name === 'AbortError'
                || error?.code === 'ABORT_ERR'
                || error?.code === 'ETIMEDOUT';

            logger.error({
                service: 'backend-api',
                event: 'upstream_call_failed',
                request_id: requestId || 'unknown',
                upstream_service: 'ml-service',
                upstream_route: '/predict',
                upstream_latency_ms: Number(upstreamLatencyMs.toFixed(3)),
                network_time_ms: responseReceivedAt
                    ? Number((Number(responseReceivedAt - fetchStartedAt) / 1_000_000).toFixed(3))
                    : undefined,
                timeout,
                error_type: error?.name || 'Error',
                code: error?.code,
            });
            throw error;
        }
    }
}

export default PredictModel;
