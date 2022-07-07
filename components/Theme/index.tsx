import { useContext } from 'react';

import ThemeIcon from 'components/Icons/Theme';
import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const Theme: React.FC = () => {
  const { theme, setTheme } = useContext(AppContext);

  return theme ? (
    <button className={classes.theme} onClick={setTheme}>
      <ThemeIcon isDarkMode={theme === 'dark'} />
    </button>
  ) : null;
};

export default Theme;
