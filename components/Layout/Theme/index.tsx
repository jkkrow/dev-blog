import Image from 'next/image';
import { useEffect, useState } from 'react';

import classes from './index.module.scss';

type Theme = 'light' | 'dark';

const Theme: React.FC = () => {
  const [mode, setMode] = useState<Theme | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    setMode(storedTheme || 'light');
  }, []);

  useEffect(() => {
    mode && (document.documentElement.className = `theme-${mode}`);
  }, [mode]);

  const toggleThemeHandler = () => {
    const theme = mode === 'light' ? 'dark' : 'light';
    setMode(theme);
    localStorage.setItem('theme', theme);
  };

  return (
    <button className={classes.theme} onClick={toggleThemeHandler}>
      {mode === 'light' ? (
        <Image src="/icons/theme-light.svg" alt="theme-light" layout="fill" />
      ) : (
        <Image src="/icons/theme-dark.svg" alt="theme-dark" layout="fill" />
      )}
    </button>
  );
};

export default Theme;
