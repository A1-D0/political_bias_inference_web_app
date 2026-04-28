import request from 'supertest';
import app from '../../src/app';

describe('GET /predict', () => {
    it('should return the prediction UI with embedded styles and script', async () => {
        const res = await request(app).get('/predict');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/html');
        expect(res.text).toContain('News Bias Prediction');
        expect(res.text).toContain('textarea');
        expect(res.text).toContain('Get Prediction');
        expect(res.text).toContain('Loading prediction...');
        expect(res.text).toContain("fetch('/api/predict'");
        expect(res.text).toContain('<style>');
        expect(res.text).toContain('<script>');
        expect(res.text).not.toContain('{{PUBLIC_CSS}}');
        expect(res.text).not.toContain('{{PUBLIC_SCRIPT}}');
    });
});
