/*
    * Description:
    * This file contains the mock function of the predict API endpoint.
    * It simulates the behavior of the Flask predict function for testing purposes.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: February 4, 2026
    * Date Modified: March 2, 2026
    * References: Copilot, ChatGPT, GeeksForGeeks, StackOverflow
*/
import dotenv from 'dotenv';
dotenv.config({ path: ".env.test" });

import fs from 'fs';
import { MLInferenceResponse } from '@usnewsweb/shared/schemas/MLInference';

function mockPredict() {
    global.fetch = jest.fn(async (url: any, options: any) => {

        // Check for api key in headers, since the ts version always requires it
        if (!options.headers || !options.headers['X-Internal-API-Key']) {
            throw {
                ok: false,
                status: 401,
                json: async () => ({ error: "Unauthorized: API key is missing." })
            };
        }

        // Check if API key is incorrect
        const expectedAPIKey = String(fs.readFileSync(process.env.INFERENCE_API_KEY)).trim();
        if (options.headers['X-Internal-API-Key'] !== expectedAPIKey) {
            throw {
                ok: false,
                status: 403,
                json: async () => ({ error: "Unauthorized: Invalid API key." })
            };
        }

        // Check for invalid inputs
        let payload: any = {};
        try {
            payload = JSON.parse(options.body);
        } catch (e) {
            throw {
                ok: false,
                status: 400,
                json: async () => ({ error: "Error processing the text input." })
            };
        }
        if (!payload.text || payload.text.trim() === '') {
            return false;
        }

        // Return an invalid prediction response format
        if (payload.text === "This is a test input to return an erroneous prediction response.") {
            return {
                ok: true,
                status: 200,
                json: async () => (
                    // This field name is incorrect on purpose, should be "prediction"
                    { invalid_prediction: "least" }
                )
            } as any; 
        }
        
        // Successful prediction
        return {
            ok: true,
            status: 200,
            json: async () => (
                { 
                    prediction: "center",
                    model_version: "model_v1.0.0",
                    label_encoder_version: "label_encoder_v1.0.0"
                } satisfies MLInferenceResponse
            )
        } as any; 
    }) as jest.Mock;
}

export default mockPredict;
