import Image from 'next/image';

import PostDate from 'components/Post/UI/Date';
import Tags from 'components/Post/UI/Tags';
import classes from './index.module.scss';

interface PostHeaderProps {
  title: string;
  tags: string[];
  image: string;
  date: string;
}

const PostHeader: React.FC<PostHeaderProps> = ({
  title,
  tags,
  image,
  date,
}) => {
  return (
    <header className={classes.header}>
      <div className={classes.image}>
        <Image src={image} alt={title} layout="fill" />
      </div>
      <div className={classes.info}>
        <div className={classes.tags}>
          <Tags tags={tags} />
        </div>
        <h1>{title}</h1>
        <PostDate date={date} />
      </div>
    </header>
  );
};

export default PostHeader;
