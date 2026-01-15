import { z } from "zod";

// health schema
export const HealthResponseSchema = z.object({
    status: z.string().default("ok"),
    service: z.string().default("healthy"),
    timestamp: z.string().datetime(),
    uptime_seconds: z.number().nonnegative(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
