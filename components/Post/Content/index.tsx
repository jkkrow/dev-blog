import { motion } from 'framer-motion';

import Header from './Header';
import Markdown from './Markdown';
import { PostDetail } from 'types/post';
import classes from './index.module.scss';

interface PostContentProps {
  post: PostDetail;
}

const variants = {
  hidden: { opacity: 0, y: 100 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 100 },
};

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const imagePath = `/images/posts/${post.slug}/${post.image}`;

  return (
    <motion.article
      className={classes.content}
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ ease: 'easeOut' }}
    >
      <Header
        title={post.title}
        tags={post.tags}
        image={imagePath}
        date={post.date}
      />
      <Markdown slug={post.slug} content={post.content} />
    </motion.article>
  );
};

export default PostContent;
