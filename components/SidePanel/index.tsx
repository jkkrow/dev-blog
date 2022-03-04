import Image from 'next/image';
import { useContext } from 'react';

import Theme from 'components/Theme';
import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const SidePanel: React.FC = () => {
  const { isIntersecting } = useContext(AppContext);

  const scrollTopHandler = () => {
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside
      className={`${classes.panel}${
        !isIntersecting ? ` ${classes.visible}` : ''
      }`}
    >
      <Theme />
      <button onClick={scrollTopHandler}>
        <Image src="/icons/arrow-top.svg" alt="Arrow Icon" layout="fill" />
      </button>
    </aside>
  );
};

export default SidePanel;
