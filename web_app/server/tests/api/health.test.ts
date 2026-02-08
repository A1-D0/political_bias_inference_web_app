/*
    * This test file checks the health check endpoint of the server.
    * It ensures that the server is running and responding correctly.
*/
import request from 'supertest';
import app from '../../src/app'; 

describe('Health Check Endpoint', () => {
    it('Get /health - it should return server status', async () => {
        const res = await request(app).get('/health'); 
        expect(res.status).toBe(200);
    })
});
