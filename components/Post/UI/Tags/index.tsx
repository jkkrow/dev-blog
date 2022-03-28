import Link from 'next/link';

import classes from './index.module.scss';

interface TagsProps {
  tags: string[];
}

const Tags: React.FC<TagsProps> = ({ tags }) => {
  return (
    <ul className={classes.tags}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link href={`/posts?tag=${tag}`}>
            <a>
              <button className={classes.tag}>{tag}</button>
            </a>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default Tags;
