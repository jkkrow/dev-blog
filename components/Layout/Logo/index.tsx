import Link from 'next/link';

import classes from './index.module.scss';

const Logo: React.FC = () => {
  return (
    <h2 className={classes.logo}>
      <Link href="/">NextJS Blog</Link>
    </h2>
  );
};

export default Logo;
