import Link from 'next/link';
import { useContext, useEffect, useRef } from 'react';

import Logo from '../Logo';
import Theme from '../../Theme';
import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const Header: React.FC = () => {
  const { setIsIntersecting } = useContext(AppContext);

  const headerRef = useRef<HTMLHeadElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = setIsIntersecting(headerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [setIsIntersecting]);

  return (
    <header className={classes.header} ref={headerRef}>
      <Logo />
      <Theme />
      <nav>
        <ul>
          <li>
            <Link href="/posts">Posts</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
