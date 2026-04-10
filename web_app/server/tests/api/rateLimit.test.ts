/*
    * This test suite checks the rate limiting functionality of the /predict endpoint.
    * It ensures that the server correctly limits the number of requests from a single IP address
    * within a specified time window, returning a 429 status code when the limit is exceeded.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: April 9, 2026
    * Date Modified: April 9, 2026
    * References: Copilot, ChatGPT, Express-rate-limit documentation
*/

import dotenv from 'dotenv';
dotenv.config({ path: ".env.test" });

import request from 'supertest';
import mockPredict from '../helpers/mockPredict.helper';
import { MAX_REQUESTS } from '../../src/middleware/rateLimiter';

describe("POST /predict", () => {
    let app: any;

    // Set up the mock predict function before each test
    beforeEach(async () => {
        mockPredict();
        app = (await import('../../src/app')).default; 
    });
    
    // Reset all mocks after each test
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("GET /predict - it should return 429", async () => {
        for (let i = 0; i < MAX_REQUESTS + 1; i++) {
            let res = await request(app)
                .post('/predict')
                .set('Content-Type', 'application/json')
                .send({ text: "This is a test input for prediction." });

            // Only check for 429 status after reaching the max requests, otherwise it should return 200
            if (i >= MAX_REQUESTS) expect(res.status).toBe(429);
        }
    });
});

