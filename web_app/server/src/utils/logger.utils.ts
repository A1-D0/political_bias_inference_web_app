/*
    * Description:
    * This module configures the backend Pino logger to emit structured JSON
    * logs with ISO timestamps and minimal default metadata for production-
    * oriented log collection.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: April 24, 2026
    * Date Modified: April 24, 2026
    * References: Copilot, ChatGPT, Pino documentation
*/
import pino from 'pino';

// Emit structured JSON logs with ISO timestamps and no default process metadata
const logger = pino({
    base: undefined,
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
});

export default logger;
