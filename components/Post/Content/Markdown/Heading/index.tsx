import classes from './index.module.scss';

const Heading = (level: 1 | 2 | 3) => {
  const heading = ({ children }: any) => {
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
        <a className={classes.hash} href={`#${convertedText}`}>
          {children}
        </a>
      </CustomTag>
    );
  };

  return heading;
};

export default Heading;
