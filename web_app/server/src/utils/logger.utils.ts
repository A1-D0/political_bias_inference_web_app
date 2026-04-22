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
