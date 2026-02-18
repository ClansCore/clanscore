module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        }],
    },
    moduleNameMapper: {
        '^@clanscore/shared$': '<rootDir>/../../shared/src/index.ts',
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
    ],
    setupFilesAfterEnv: [],
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$))',
    ],
};

