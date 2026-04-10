import express from 'express';
import routes from './routes/routes';

const app = express();

app.use(express.json());

app.set('trust proxy', true); // Trust the first proxy (e.g., Cloudflare) to get the correct client IP address

routes(app);

export default app;
