import PostHeader from '../Header';
import { PostDetail } from 'types/post';
import classes from './index.module.scss';

interface PostContentProps {
  post: PostDetail;
}

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const imagePath = `/images/posts/${post.slug}/${post.image}`;

  return (
    <article className={classes.content}>
      <PostHeader title={post.title} image={imagePath} />
    </article>
  );
};

export default PostContent;
