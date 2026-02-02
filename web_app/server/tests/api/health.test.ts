import request from 'supertest';
import app from '../../src/app'; 

describe('Health Check Endpoint', () => {
    it('Get /health - it should return server status', async () => {
        const res = await request(app).get('/health'); 
        expect(res.status).toBe(200);
    })
});
