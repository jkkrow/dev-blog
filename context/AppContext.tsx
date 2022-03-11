import { createContext, useState, useEffect, useCallback, useRef } from 'react';

export type Theme = 'light' | 'dark';

export const AppContext = createContext<{
  theme: Theme | null;
  ref: React.RefObject<HTMLElement> | null;
  setTheme: () => void;
}>({
  theme: null,
  ref: null,
  setTheme: () => {},
});

const AppContextProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<Theme | null>(null);

  const contextRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    setTheme(storedTheme || 'light');
  }, []);

  useEffect(() => {
    theme && (document.documentElement.className = `theme-${theme}`);
  }, [theme]);

  const toggleThemeHandler = useCallback(() => {
    const changedTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(changedTheme);
    localStorage.setItem('theme', changedTheme);
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        theme,
        ref: contextRef,
        setTheme: toggleThemeHandler,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
