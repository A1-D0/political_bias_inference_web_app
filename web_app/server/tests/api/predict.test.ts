/*
    * Description: 
    * This file contains unit tests for the predict function.
    * It uses Jest mock functions to simulate the Flask predict API endpoint.
    * The tests cover various scenarios, including valid input, missing input, 
    * and invalid response formats.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: February 1, 2026
    * Date Modified: April 24, 2026
    * References: Copilot, ChatGPT, GeeksForGeeks, StackOverflow
*/
import request from 'supertest';
import mockPredict from '../helpers/mockPredict.helper';
import logger from '../../src/utils/logger.utils';

describe("POST /api/predict", () => {
    let app: any;
    let loggerInfoSpy: jest.SpyInstance;

    // Set up the mock predict function before each test
    beforeEach(async () => {
        mockPredict();
        loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined as any);
        app = (await import('../../src/app')).default; 
    });
    
    // Reset all mocks after each test
    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    // Simple valid prediction text
    it("should return 200 and prediction for valid input", async () => {
        const res = await request(app)
            .post('/api/predict')
            .set('X-Request-Id', 'req_test123456')
            .set('Content-Type', 'application/json')
            .send({ text: "This is a test input for prediction." });
        
        expect(res.body).toHaveProperty('prediction');
        expect(res.body).toHaveProperty('model_version');
        expect(res.body).toHaveProperty('label_encoder_version');
        expect(res.status).toBe(200);
        expect(res.headers['x-request-id']).toBe('req_test123456');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Request-Id': 'req_test123456',
                }),
            }),
        );

        expect(loggerInfoSpy).toHaveBeenCalledWith(expect.objectContaining({
            service: 'backend-api',
            event: 'upstream_call_completed',
            request_id: 'req_test123456',
            upstream_service: 'ml-service',
            upstream_route: '/predict',
            upstream_status_code: 200,
            timeout: false,
        }));

        expect(loggerInfoSpy).toHaveBeenCalledWith(expect.objectContaining({
            service: 'backend-api',
            event: 'request_completed',
            request_id: 'req_test123456',
            method: 'POST',
            route: '/api/predict',
            status_code: 200,
            client_ip_hash: expect.any(String),
            user_agent: expect.any(String),
            request_body_bytes: expect.any(Number),
            response_body_bytes: expect.any(Number),
        }));

        const requestLog = loggerInfoSpy.mock.calls.find(([entry]) => {
            return entry?.event === 'request_completed';
        })?.[0];
        expect(requestLog).not.toEqual(expect.objectContaining({
            text: "This is a test input for prediction.",
        }));
    });

    // Check for missing input (missing "text" field) 
    // Note that this test can also be used to check for wrong input types, such as 
    // sending a number instead of a string, or another field instead of "text"
    it("should return 400 if text field is missing (less than 1 char)", async () => {
        const res = await request(app)
            .post('/api/predict')
            .set('Content-Type', 'application/json')
            .send({ text: "" });
        
        // Note that the validateResource middleware returns 400 for invalid request data
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid request data');
    });

    it("should log request completion when malformed JSON fails before route handling", async () => {
        const res = await request(app)
            .post('/api/predict')
            .set('X-Request-Id', 'req_badjson123')
            .set('Content-Type', 'application/json')
            .send('{"text":');

        expect(res.status).toBe(400);
        expect(res.headers['x-request-id']).toBe('req_badjson123');
        expect(global.fetch).not.toHaveBeenCalled();

        expect(loggerInfoSpy).toHaveBeenCalledWith(expect.objectContaining({
            service: 'backend-api',
            event: 'request_completed',
            request_id: 'req_badjson123',
            method: 'POST',
            route: '/api/predict',
            status_code: 400,
            client_ip_hash: expect.any(String),
            user_agent: expect.any(String),
            request_body_bytes: expect.any(Number),
            response_body_bytes: expect.any(Number),
        }));

        const requestLog = loggerInfoSpy.mock.calls.find(([entry]) => {
            return entry?.event === 'request_completed'
                && entry?.request_id === 'req_badjson123';
        })?.[0];
        expect(requestLog?.request_body_bytes).toBeGreaterThan(0);
    });

    // Check for invalid response 
    it("should return 500 if prediction response format is invalid", async () => {
        const res = await request(app)
            .post('/api/predict')
            .set('Content-Type', 'application/json')
            .send({ text: "This is a test input to return an erroneous prediction response." });
        
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'Invalid prediction response format');
    });
});
