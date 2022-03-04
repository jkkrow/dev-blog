import Image from 'next/image';
import { useContext } from 'react';

import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const Theme: React.FC = () => {
  const { theme, setTheme } = useContext(AppContext);

  return (
    <button className={classes.theme} onClick={setTheme}>
      {theme === 'light' ? (
        <Image src="/icons/theme-light.svg" alt="theme-light" layout="fill" />
      ) : (
        <Image src="/icons/theme-dark.svg" alt="theme-dark" layout="fill" />
      )}
    </button>
  );
};

export default Theme;
