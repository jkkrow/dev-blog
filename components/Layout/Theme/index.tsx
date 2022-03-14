import { useContext } from 'react';

import ThemeLight from 'components/Icons/ThemeLight';
import ThemeDark from 'components/Icons/ThemeDark';
import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const Theme: React.FC = () => {
  const { theme, setTheme } = useContext(AppContext);

  return (
    <button className={classes.theme} onClick={setTheme}>
      {theme === 'light' ? <ThemeLight /> : <ThemeDark />}
    </button>
  );
};

export default Theme;
