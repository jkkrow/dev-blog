import { motion, AnimatePresence } from 'framer-motion';

import PostItem from '../Item';
import { Post } from 'types/post';
import classes from './index.module.scss';

interface PostGridProps {
  posts: Post[];
  label?: string;
}

const variants = {
  hidden: { x: '100%' },
  enter: { x: 0 },
  exit: { x: '-100%' },
};

const PostGrid: React.FC<PostGridProps> = ({ posts, label }) => {
  return (
    <motion.section
      className={classes.section}
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ ease: 'easeOut' }}
    >
      {label && <h2 className={classes.label}>{label}</h2>}
      <motion.ul layout className={classes.grid}>
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <PostItem key={post.slug} post={post} />
          ))}
        </AnimatePresence>
      </motion.ul>
    </motion.section>
  );
};

export default PostGrid;
