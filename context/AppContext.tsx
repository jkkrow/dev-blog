import { createContext, useState, useEffect, useCallback, useRef } from 'react';

export type Theme = 'light' | 'dark';

export const AppContext = createContext<{
  theme: Theme | null;
  headerRef: React.RefObject<HTMLElement> | null;
  setTheme: () => void;
}>({
  theme: null,
  headerRef: null,
  setTheme: () => {},
});

const AppContextProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<Theme | null>(null);

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('blog-theme') as Theme | null;
    setTheme(storedTheme || 'light');
  }, []);

  useEffect(() => {
    theme && (document.documentElement.className = `theme-${theme}`);
  }, [theme]);

  const toggleThemeHandler = useCallback(() => {
    const changedTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(changedTheme);
    localStorage.setItem('blog-theme', changedTheme);
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        theme,
        headerRef,
        setTheme: toggleThemeHandler,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
