import { motion } from 'framer-motion';

import Header from './Header';
import Markdown from './Markdown';
import ContentTable from './Table';
import { PostDetail } from 'types/post';
import classes from './index.module.scss';

interface PostContentProps {
  post: PostDetail;
}

const mainVariants = {
  hidden: { opacity: 0, y: 100 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 100 },
};

const asideVariants = {
  hidden: { opacity: 0, x: 100 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const imagePath = `/images/posts/${post.slug}/${post.image}`;

  return (
    <div className={classes.content}>
      <motion.article
        className={classes.main}
        variants={mainVariants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={{ ease: 'easeOut' }}
      >
        <Header
          image={imagePath}
          title={post.title}
          tags={post.tags}
          date={post.date}
        />
        <Markdown slug={post.slug} content={post.content} />
      </motion.article>

      <motion.aside
        className={classes.aside}
        variants={asideVariants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={{ ease: 'easeOut' }}
      >
        <ContentTable post={post} />
      </motion.aside>
    </div>
  );
};

export default PostContent;
