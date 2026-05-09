/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tests/tsconfig.json' },
    ],
  },
  moduleNameMapper: {
    // Redirect firebase.utility imports to our mock (no real Firebase init)
    '^(.*[\\/])firebase\\.utility(\\.ts)?$': '<rootDir>/tests/__mocks__/firebase.ts',
    // Redirect stripe.utility imports to our mock (no real Stripe key required)
    '^(.*[\\/])stripe\\.utility(\\.ts)?$': '<rootDir>/tests/__mocks__/stripe.ts',
  },
};
