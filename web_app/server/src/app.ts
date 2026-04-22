import express from 'express';
import routes from './routes/routes';
import { backendRequestCompletionLogger, InstrumentedRequest } from './middleware/backendRequestCompletionLogger';

const app = express();

// Capture request body size for request-completion logs while parsing JSON
app.use(express.json({
    verify: (req, _res, buf) => {
        (req as InstrumentedRequest).rawBodyBytes = buf.length;
    },
}));

app.set('trust proxy', true); // Trust the first proxy (e.g., Cloudflare) to get the correct client IP address

app.use(backendRequestCompletionLogger);

routes(app);

export default app;
