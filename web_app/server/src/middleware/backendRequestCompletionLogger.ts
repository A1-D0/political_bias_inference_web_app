/*
    * Description:
    * This middleware handles backend request correlation and emits structured
    * request completion logs after responses finish. It also tracks request
    * IDs and request/response byte counts for logging purposes.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: April 24, 2026
    * Date Modified: April 24, 2026
    * References: Copilot, ChatGPT, Express documentation, Node.js documentation
*/
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.utils';

type ResponseChunk = string | Buffer | Uint8Array;
type ResponseWriteCallback = (error?: Error | null) => void;

// Handles backend request correlation and emits one structured completion log per response
export type InstrumentedRequest = Request & {
    // rawBodyBytes is populated by the JSON parser verify hook in app.ts
    rawBodyBytes?: number;
    // requestId is attached here so downstream handlers can forward it to upstream services
    requestId?: string;
};

function hashClientIdentifier(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function generateRequestId(): string {
    return `req_${crypto.randomBytes(6).toString('hex')}`;
}

function getRouteLabel(req: Request): string {
    if (req.route?.path && req.baseUrl) {
        return `${req.baseUrl}${req.route.path}`;
    }

    if (req.route?.path) {
        return String(req.route.path);
    }

    return req.path || req.originalUrl || 'unknown';
}

function getChunkByteLength(chunk: unknown): number {
    if (!chunk) {
        return 0;
    }

    return Buffer.isBuffer(chunk)
        ? chunk.length
        : Buffer.byteLength(String(chunk));
}

/**
 * Reuses or creates X-Request-Id, exposes it to downstream handlers, and
 * logs sanitized request/response metadata when the response finishes
 */
export function backendRequestCompletionLogger(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const request = req as InstrumentedRequest;
    const startedAt = process.hrtime.bigint();
    const incomingRequestId = req.get('X-Request-Id')?.trim();
    const requestId = incomingRequestId || generateRequestId();
    const clientIP = (req.headers['cf-connecting-ip'] as string) || req.ip || 'unknown';
    const clientIpHash = hashClientIdentifier(clientIP);
    let responseBodyBytes = 0;

    request.requestId = requestId;
    res.locals.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    // Wrap response writes so the completion log can include the response body size
    res.write = ((
        chunk: ResponseChunk,
        encoding?: BufferEncoding | ResponseWriteCallback,
        callback?: ResponseWriteCallback,
    ) => {
        responseBodyBytes += getChunkByteLength(chunk);

        return originalWrite(chunk, encoding as BufferEncoding, callback);
    }) as typeof res.write;

    res.end = ((
        chunk?: ResponseChunk,
        encoding?: BufferEncoding | ResponseWriteCallback,
        callback?: ResponseWriteCallback,
    ) => {
        responseBodyBytes += getChunkByteLength(chunk);

        return originalEnd(chunk, encoding as BufferEncoding, callback);
    }) as typeof res.end;

    res.on('finish', () => {
        const latencyMilliseconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const requestBodyBytes = (request.rawBodyBytes ?? Number(req.get('content-length') || 0)) || 0;

        logger.info({
            service: 'backend-api',
            event: 'request_completed',
            request_id: requestId,
            method: req.method,
            route: getRouteLabel(req),
            status_code: res.statusCode,
            latency_ms: Number(latencyMilliseconds.toFixed(3)),
            client_ip_hash: clientIpHash,
            user_agent: req.get('user-agent') || 'unknown',
            request_body_bytes: requestBodyBytes,
            response_body_bytes: responseBodyBytes,
        });
    });

    next();
}
