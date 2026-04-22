import pino from 'pino';

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
