
import { Request } from 'express';
import { rateLimit, ipKeyGenerator }from 'express-rate-limit';
import logger from '../utils/logger.utils';

const WINDOW_MILLISECONDS = () => {
    // default to 60 seconds (1 minute) if not set in environment variable
    const envSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60);

    const milliseconds = envSeconds * 1000;

    return milliseconds;
}; 

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100); // default to 100 requests per window

export const rateLimiter = rateLimit({
    windowMs: WINDOW_MILLISECONDS(),
    max: MAX_REQUESTS,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers

    keyGenerator: (req: Request) => {
        // Extract the client's IP address from the request
        
        // Cloudflare's header for client IP
        const IP = (req.headers['cf-connecting-ip'] as string) || req.ip;

        return ipKeyGenerator(IP); // Fallback to Express's default IP extraction
    },

    handler: (req, res) => {
        const IP = (req.headers['cf-connecting-ip'] as string) || req.ip;

        logger.error({ ip: IP }, `Client IP is blocked on ${req.path} due to rate limiting`);

        res.status(429)
        .json({ error: 'Too many requests, please try again later.' });
    },
});
