import Link from 'next/link';
import { useState } from 'react';

import Logo from '../Logo';
import classes from './index.module.scss';

const Header: React.FC = () => {
  const [hideHeader, setHideHeader] = useState(false);

  return (
    <header
      className={`${classes.header}${hideHeader ? ` ${classes.hide}` : ''}`}
    >
      <Logo />
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
