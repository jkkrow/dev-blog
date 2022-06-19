import Link from 'next/link';

import classes from './index.module.scss';

const Anchor = ({ children, href }: any) => {
  const isHashLink = href![0] === '#';

  if (isHashLink) {
    return (
      <Link href={href} replace>
        <a className={classes.hash}>{children}</a>
      </Link>
    );
  }

  return (
    <Link href={href!}>
      <a>{children}</a>
    </Link>
  );
};

export default Anchor;
