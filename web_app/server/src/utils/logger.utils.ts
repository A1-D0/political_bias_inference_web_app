import pino from 'pino';

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd hh:mm:ss',
            ignore: 'pid,hostname'
        }
    },
});

export default logger;
