import Link from 'next/link';
import classes from './index.module.scss';

const Heading = ({ level, children }: any) => {
  const CustomTag = `h${level}` as keyof JSX.IntrinsicElements;

  if (!children) {
    return <CustomTag>{children}</CustomTag>;
  }

  const text = children[0] as string;
  const convertedText = text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-');

  return (
    <CustomTag id={convertedText}>
      <Link href={`#${convertedText}`} replace>
        <a className={classes.hash}>{children}</a>
      </Link>
    </CustomTag>
  );
};

export default Heading;
