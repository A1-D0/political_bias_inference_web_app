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
    * Date Created: April 24, 2026
    * Date Modified: April 24, 2026
    * References: Copilot, ChatGPT, Express-rate-limit documentation
*/

import crypto from 'crypto';
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

function hashClientIdentifier(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

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

        logger.error({
            service: 'backend-api',
            event: 'rate_limit_blocked',
            request_id: res.locals.requestId || 'unknown',
            route: req.path,
            client_ip_hash: hashClientIdentifier(IP || 'unknown'),
        });

        res.status(429)
        .json({ error: 'Too many requests, please try again later.' });
    },
});
