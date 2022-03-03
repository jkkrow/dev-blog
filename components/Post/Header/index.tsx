import Image from 'next/image';

import classes from './index.module.scss';

interface PostHeaderProps {
  title: string;
  image: string;
}

const PostHeader: React.FC<PostHeaderProps> = ({ title, image }) => {
  return (
    <header className={classes.header}>
      <h1>{title}</h1>
      <div className={classes.image}>
        <Image src={image} alt={title} layout="fill" />
      </div>
    </header>
  );
};

export default PostHeader;
