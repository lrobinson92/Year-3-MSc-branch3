// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import rootReducer from './reducers';

export const renderWithRedux = (
  ui,
  {
    initialState = {},
    store = configureStore({
      reducer: rootReducer,
      preloadedState: initialState
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store
  };
};

// Mock axios
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: {
      adapter: jest.fn(),
      headers: {
        common: {},
      },
    },
  };
  return mockAxios;
});

// Mock your axiosInstance util if it's used in components
jest.mock('./utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  }
}));

// Mock the googledrive action
jest.mock('./actions/googledrive', () => ({
  googleDriveLogin: jest.fn(() => ({ type: 'GOOGLE_DRIVE_LOGIN' }))
}));