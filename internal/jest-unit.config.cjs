// Pure layout tests do not need Expo's native-module setup or a Watchman daemon.
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  watchman: false,
  testMatch: ['<rootDir>/src/__tests__/menuLayout.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
};
