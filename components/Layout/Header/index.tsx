import Link from 'next/link';
import { useContext } from 'react';

import Logo from '../Logo';
import Theme from '../Theme';
import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const Header: React.FC = () => {
  const { ref } = useContext(AppContext);

  return (
    <header className={classes.header} ref={ref}>
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
