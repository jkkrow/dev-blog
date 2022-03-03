import PostItem from '../Item';
import { Post } from 'types/post';
import classes from './index.module.scss';

interface PostGridProps {
  posts: Post[];
  label?: string;
}

const PostGrid: React.FC<PostGridProps> = ({ posts, label }) => {
  return (
    <section className={classes.section}>
      {label && <h2 className={classes.label}>{label}</h2>}
      <ul className={classes.grid}>
        {posts.map((post) => (
          <PostItem key={post.slug} post={post} />
        ))}
      </ul>
    </section>
  );
};

export default PostGrid;
