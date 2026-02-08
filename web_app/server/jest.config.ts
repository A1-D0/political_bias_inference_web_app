import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    clearMocks: true,
    bail: 0,
    verbose: true,
    setupFiles: ['<rootDir>/tests/setup.ts'],
    globals: {
        "ts-jest": {
            diagnostics: { ignoreCodes: [151002] }
        }
    }
};

export default config;
