/** @type {import('jest').Config} */
export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/tests/**/*.test.ts?(x)'],
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      // Jest runs CommonJS; type-checking is done by `npm run typecheck`, so transpile only here.
      { tsconfig: { jsx: 'react-jsx', module: 'commonjs', esModuleInterop: true, isolatedModules: true } },
    ],
  },
  moduleNameMapper: {
    // import.meta.env only exists under Vite; Jest gets static values instead.
    '^.+/constants/env$': '<rootDir>/src/tests/mocks/env.ts',
    '\.css$': '<rootDir>/src/tests/mocks/env.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // The first integration test of a file pays the one-off cost of loading lazy MUI pages; under a full
  // parallel run that can exceed Jest's 5 s default.
  testTimeout: 15000,
};
