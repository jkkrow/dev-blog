import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Mode = 'light' | 'dark';

interface ThemeState {
  mode: Mode;
}

const initialState: ThemeState = {
  mode: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, { payload }: PayloadAction<Mode>) => {
      state.mode = payload;
    },

    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;

export default themeSlice.reducer;
