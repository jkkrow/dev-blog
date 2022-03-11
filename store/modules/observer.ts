import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ObserverState {
  isIntersecting: boolean;
}

const initialState: ObserverState = {
  isIntersecting: true,
};

const observerSlice = createSlice({
  name: 'observer',
  initialState,
  reducers: {
    setIsIntersecting: (state, { payload }: PayloadAction<boolean>) => {
      state.isIntersecting = payload;
    },
  },
});

export const { setIsIntersecting } = observerSlice.actions;

export default observerSlice.reducer;
