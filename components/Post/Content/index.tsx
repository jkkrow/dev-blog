import Header from './Header';
import Markdown from './Markdown';
import { PostDetail } from 'types/post';
import classes from './index.module.scss';

interface PostContentProps {
  post: PostDetail;
}

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const imagePath = `/images/posts/${post.slug}/${post.image}`;

  return (
    <article className={classes.content}>
      <Header
        title={post.title}
        tags={post.tags}
        image={imagePath}
        date={post.date}
      />
      <Markdown slug={post.slug} content={post.content} />
    </article>
  );
};

export default PostContent;
