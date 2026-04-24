/*
    * Description:
    * This module configures the backend Express application and registers
    * the logging-aware middleware order for request completion logging,
    * request body byte capture, and route handling.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: April 24, 2026
    * Date Modified: April 24, 2026
    * References: Copilot, ChatGPT, Express documentation
*/
import express from 'express';
import routes from './routes/routes';
import { backendRequestCompletionLogger, InstrumentedRequest } from './middleware/backendRequestCompletionLogger';

const app = express();

app.set('trust proxy', true); // Trust the first proxy (e.g., Cloudflare) to get the correct client IP address

app.use(backendRequestCompletionLogger);

// Capture request body size for request-completion logs while parsing JSON
app.use(express.json({
    verify: (req, _res, buf) => {
        (req as InstrumentedRequest).rawBodyBytes = buf.length;
    },
}));

routes(app);

export default app;
