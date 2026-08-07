module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/lib'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      { tsconfig: 'tsconfig.json' },
    ],
  },
};
