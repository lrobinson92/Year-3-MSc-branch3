module.exports = {
  // Use default test environment (jsdom for browser-like environment)
  testEnvironment: "jsdom",
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  
  // Transform files with babel-jest
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  
  // Don't transform node_modules, except for specific libraries that use ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(axios|react-dnd|dnd-core|@react-dnd|redux-thunk|@redux-saga)/)"
  ],
  
  // Mock CSS/SCSS/image files
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/src/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/src/__mocks__/fileMock.js"
  },
  
  // Test match patterns
  testMatch: ["**/__tests__/**/*.js?(x)", "**/?(*.)+(spec|test).js?(x)"]
};