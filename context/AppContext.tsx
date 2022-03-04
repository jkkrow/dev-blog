import { createContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

export const AppContext = createContext<{
  theme: Theme | null;
  isIntersecting: boolean;
  setTheme: () => void;
  setIsIntersecting: (element: HTMLElement) => IntersectionObserver;
}>({
  theme: null,
  isIntersecting: true,
  setTheme: () => {},
  setIsIntersecting: () => new IntersectionObserver(() => {}),
});

const AppContextProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);

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

  const intersectObserveHandler = useCallback((element: HTMLElement) => {
    const observer = new IntersectionObserver(([entry], observer) => {
      setIsIntersecting(entry.isIntersecting);
    });

    observer.observe(element);

    return observer;
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme,
        isIntersecting,
        setTheme: toggleThemeHandler,
        setIsIntersecting: intersectObserveHandler,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
