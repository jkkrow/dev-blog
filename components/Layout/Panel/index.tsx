import { useContext, useEffect, useState } from 'react';

import Theme from 'components/Layout/Theme';
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
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11 20C11 20.5523 11.4477 21 12 21C12.5523 21 13 20.5523 13 20L11 20ZM12.7071 3.29289C12.3166 2.90237 11.6834 2.90237 11.2929 3.29289L4.92893 9.65685C4.53841 10.0474 4.53841 10.6805 4.92893 11.0711C5.31946 11.4616 5.95262 11.4616 6.34315 11.0711L12 5.41421L17.6569 11.0711C18.0474 11.4616 18.6805 11.4616 19.0711 11.0711C19.4616 10.6805 19.4616 10.0474 19.0711 9.65685L12.7071 3.29289ZM13 20L13 4L11 4L11 20L13 20Z"
            stroke="none"
          />
        </svg>
      </button>
    </aside>
  );
};

export default Panel;
