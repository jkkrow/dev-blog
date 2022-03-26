import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.ul layout className={classes.grid}>
        <AnimatePresence>
          {posts.map((post) => (
            <PostItem key={post.slug} post={post} />
          ))}
        </AnimatePresence>
      </motion.ul>
    </section>
  );
};

export default PostGrid;
