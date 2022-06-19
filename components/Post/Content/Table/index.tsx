import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

import { PostDetail } from 'types/post';
import classes from './index.module.scss';

interface ContentTableProps {
  post: PostDetail;
}

const Heading = ({ level, children }: any) => {
  const text = children[0] as string;
  const convertedText = text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-');

  return (
    <li className={classes[`h${level}`]}>
      <Link href={`#${convertedText}`} replace>
        <a>{children}</a>
      </Link>
    </li>
  );
};

const ContentTable: React.FC<ContentTableProps> = ({ post }) => {
  return (
    <div className={classes.table}>
      <h3>{post.title}</h3>
      <ul>
        <ReactMarkdown
          allowedElements={['h1', 'h2', 'h3']}
          skipHtml
          components={{
            h1: Heading,
            h2: Heading,
            h3: Heading,
          }}
        >
          {post.content}
        </ReactMarkdown>
      </ul>
    </div>
  );
};

export default ContentTable;
