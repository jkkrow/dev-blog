import { useContext, useEffect, useState } from 'react';

import Theme from 'components/Theme';
import ArrowTop from 'public/icons/arrow-top.svg';
import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const Panel: React.FC = () => {
  const [isIntersecting, setIsIntersecting] = useState(true);
  const { headerRef } = useContext(AppContext);

  useEffect(() => {
    if (!headerRef || !headerRef.current) return;

    const observer = new IntersectionObserver(([entry], observer) => {
      setIsIntersecting(entry.isIntersecting);
    });

    observer.observe(headerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [headerRef]);

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
        <ArrowTop />
      </button>
    </aside>
  );
};

export default Panel;
