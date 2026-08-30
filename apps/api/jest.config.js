module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@masajid/shared-types$': '<rootDir>/../../../packages/shared-types/src',
    '^@masajid/shared-validation$': '<rootDir>/../../../packages/shared-validation/src',
  },
};
