import { useContext, useEffect, useState } from 'react';

import Theme from 'components/Layout/Theme';
import ArrowTop from 'public/icons/arrow-top.svg';
import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const Panel: React.FC = () => {
  const [isIntersecting, setIsIntersecting] = useState(true);
  const { ref } = useContext(AppContext);

  useEffect(() => {
    if (!ref || !ref.current) return;

    const observer = new IntersectionObserver(([entry], observer) => {
      setIsIntersecting(entry.isIntersecting);
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

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
