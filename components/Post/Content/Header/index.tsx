import PostDate from 'components/Post/UI/Date';
import Tags from 'components/Post/UI/Tags';
import Image from 'components/Image';
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
      <Image src={image} alt={title} />
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
