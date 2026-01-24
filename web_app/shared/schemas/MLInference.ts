import { z, object } from "zod";

const MAX_TEXT_LENGTH = 3000;

// ML Inference Request Schema
export const MLInferenceRequestSchema = object({
    body: object({
        text: z.string({
            required_error: "Text is required for ML inference",
        })
    .trim()
    .min(1, { message: "Text cannot be empty" })
    .max(MAX_TEXT_LENGTH, { message: "Text cannot exceed 3000 characters" }),
    }),
});


// ML Inference Response Schema
export const MLInferenceResponseSchema = object({
    prediction: z.string(),
});

export type MLInferenceRequest = z.infer<typeof MLInferenceRequestSchema>["body"];
export type MLInferenceResponse = z.infer<typeof MLInferenceResponseSchema>;
