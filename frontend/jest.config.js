module.exports = {
  // Use default test environment (jsdom for browser-like environment)
  testEnvironment: "jsdom",
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  
  // Transform files with babel-jest
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  
  // Don't transform node_modules, except for specific libraries that use ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(axios|react-dnd|dnd-core|@react-dnd|redux-thunk|@redux-saga)/)"
  ],
  
  // Mock CSS/SCSS/image files
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js"
  },
  
  // Test match patterns
  testMatch: ["**/__tests__/**/*.js?(x)", "**/?(*.)+(spec|test).js?(x)"],
  
  // Ignore test paths
  testPathIgnorePatterns: ["/node_modules/", "/build/"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/index.js",
    "!src/reportWebVitals.js",
    "!src/setupTests.js",
    "!**/node_modules/**"
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage"
};