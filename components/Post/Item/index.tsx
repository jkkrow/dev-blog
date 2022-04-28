import Link from 'next/link';
import { motion } from 'framer-motion';

import PostDate from '../UI/Date';
import Tags from '../UI/Tags';
import Image from 'components/Image';
import { Post } from 'types/post';
import classes from './index.module.scss';

interface PostItemProps {
  post: Post;
}

const variants = {
  hidden: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const imagePath = `/images/posts/${post.slug}/${post.image}`;
  const linkPath = `/posts/${post.slug}`;

  return (
    <motion.li
      className={classes.item}
      layout
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ ease: 'easeOut' }}
    >
      <Link href={linkPath}>
        <a>
          <Image src={imagePath} alt={post.title} />
        </a>
      </Link>
      <div className={classes.content}>
        <Link href={linkPath}>
          <a>
            <h3>{post.title}</h3>
          </a>
        </Link>
        <PostDate date={post.date} />
        <p>{post.excerpt}</p>
        <Tags tags={post.tags} />
      </div>
    </motion.li>
  );
};

export default PostItem;
