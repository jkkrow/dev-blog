import { useRouter } from 'next/router';
import { useMemo } from 'react';

import classes from './index.module.scss';

interface TagsProps {
  tags: string | string[];
}

const Tags: React.FC<TagsProps> = ({ tags }) => {
  const router = useRouter();

  const queryTags = useMemo(() => {
    const tags = router.query.tags;
    if (!tags) return;

    return tags instanceof Array ? tags : [tags];
  }, [router.query.tags]);

  const tagArray = useMemo(() => {
    return tags instanceof Array ? tags : [tags];
  }, [tags]);

  const addTagHandler = (tag: string) => {
    return () => {
      const newTags = queryTags ? [...queryTags, tag] : [tag];

      router.push({
        pathname: '/posts',
        query: { tags: newTags },
      });
    };
  };

  return (
    <ul className={classes.tags}>
      {tagArray.map((tag) => (
        <li key={tag} onClick={addTagHandler(tag)}>
          <button className={classes.tag}>{tag}</button>
        </li>
      ))}
    </ul>
  );
};

export default Tags;
