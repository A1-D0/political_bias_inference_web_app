/*
    * Rate Limiting Middleware for Express.js
    * This middleware limits the number of requests a client can make to the server within a specified time window.
    * It uses the 'express-rate-limit' package to handle rate limiting logic and supports IP-based key generation.
    * The configuration for the rate limiter can be set through environment variables:
    * - RATE_LIMIT_WINDOW_SECONDS: The duration of the time window in seconds (default: 60 seconds).
    * - RATE_LIMIT_MAX_REQUESTS: The maximum number of requests allowed per window (default: 100 requests).
    *
    * The middleware also logs blocked requests with the client's IP address for monitoring purposes.
    *
    * Author: Osvaldo Hernandez-Segura
*/

import { Request } from 'express';
import { rateLimit, ipKeyGenerator }from 'express-rate-limit';
import logger from '../utils/logger.utils';

export const WINDOW_MILLISECONDS = () => {
    // default to 60 seconds (1 minute) if not set in environment variable
    const envSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60);

    const milliseconds = envSeconds * 1000;

    return milliseconds;
}; 

export const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100); // default to 100 requests per window

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

