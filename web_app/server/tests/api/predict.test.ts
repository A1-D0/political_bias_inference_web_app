/*
    * Description: 
    * This file contains unit tests for the predict function.
    * It uses Jest mock functions to simulate the Flask predict API endpoint.
    * The tests cover various scenarios, including valid input, missing input, 
    * and invalid response formats.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: February 1, 2026
    * Date Modified: February 7, 2026
    * References: Copilot, ChatGPT, GeeksForGeeks, StackOverflow
*/
import request from 'supertest';
import mockPredict from '../helpers/mockPredict.helper';

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

    // Simple valid prediction text
    it("should return 200 and prediction for valid input", async () => {
        const res = await request(app)
            .post('/predict')
            .set('Content-Type', 'application/json')
            .send({ text: "This is a test input for prediction." });
        
        expect(res.body).toHaveProperty('prediction');
        expect(res.status).toBe(200);
    });

    // Check for missing input (missing "text" field) 
    // Note that this test can also be used to check for wrong input types, such as 
    // sending a number instead of a string, or another field instead of "text"
    it("should return 400 if text field is missing (less than 1 char)", async () => {
        const res = await request(app)
            .post('/predict')
            .set('Content-Type', 'application/json')
            .send({ text: "" });
        
        // Note that the validateResource middleware returns 400 for invalid request data
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid request data');
    });

    // Check for invalid response 
    it("should return 500 if prediction response format is invalid", async () => {
        const res = await request(app)
            .post('/predict')
            .set('Content-Type', 'application/json')
            .send({ text: "This is a test input to return an erroneous prediction response." });
        
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'Invalid prediction response format');
    });
});
