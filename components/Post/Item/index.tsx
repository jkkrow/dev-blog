import Link from 'next/link';
import Image from 'next/image';

import { Post } from 'types/post';
import classes from './index.module.scss';

interface PostItemProps {
  post: Post;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const imagePath = `/images/posts/${post.slug}/${post.image}`;
  const linkPath = `/posts/${post.slug}`;

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <li className={classes.item}>
      <Link href={linkPath}>
        <a>
          <div className={classes.image}>
            <Image src={imagePath} alt={post.title} layout="fill" />
          </div>
        </a>
      </Link>
      <div className={classes.content}>
        <Link href={linkPath}>
          <a>
            <h3>{post.title}</h3>
          </a>
        </Link>
        <time>{formattedDate}</time>
        <p>{post.excerpt}</p>
      </div>
    </li>
  );
};

export default PostItem;
