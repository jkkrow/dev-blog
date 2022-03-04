import Link from 'next/link';

import Logo from '../Logo';
import Theme from '../Theme';
import classes from './index.module.scss';

const Header: React.FC = () => {
  return (
    <header className={classes.header}>
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
