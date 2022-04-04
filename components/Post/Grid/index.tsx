import { useRouter } from 'next/router';
import { useMemo } from 'react';
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
  const router = useRouter();

  const queryTags = useMemo(() => {
    const tags = router.query.tags;
    if (!tags) return;

    return tags instanceof Array ? tags : [tags];
  }, [router.query.tags]);

  const removeTagHandler = (tag: string) => {
    return () => {
      if (!queryTags) return;

      router.push({
        pathname: router.pathname,
        query: { tags: queryTags.filter((queryTag) => queryTag !== tag) },
      });
    };
  };

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
      {queryTags && (
        <motion.h2 layout className={classes.label}>
          {queryTags.map((tag) => (
            <motion.span
              layout
              key={tag}
              className={classes.tag}
              onClick={removeTagHandler(tag)}
            >
              #{tag}
            </motion.span>
          ))}
        </motion.h2>
      )}

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
