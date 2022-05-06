import Link from 'next/link';

import classes from './index.module.scss';

const Anchor = ({ children, href }: any) => {
  const isHashLink = href![0] === '#';

  if (isHashLink) {
    return (
      <a className={classes.hash} href={href}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href!}>
      <a>{children}</a>
    </Link>
  );
};

export default Anchor;
