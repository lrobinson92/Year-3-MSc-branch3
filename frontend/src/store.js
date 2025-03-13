import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';


const store = configureStore({
    reducer: rootReducer,  // Your combined reducers
    devTools: process.env.NODE_ENV !== 'production',  // Automatically enable Redux DevTools
  });

export default store;