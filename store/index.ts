import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import themeReducer from './modules/theme';
import observerReducer from './modules/observer';

const store = configureStore({
  reducer: {
    theme: themeReducer,
    observer: observerReducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

export const { withRedux } = createWrapper(() => store);
