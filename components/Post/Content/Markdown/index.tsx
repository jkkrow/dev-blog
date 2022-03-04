import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import atomDark from 'react-syntax-highlighter/dist/cjs/styles/prism/atom-dark';
import js from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';

import classes from './index.module.scss';

SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('css', css);

interface MarkdownProps {
  slug: string;
  content: string;
}

const Markdown: React.FC<MarkdownProps> = ({ slug, content }) => {
  return (
    <section className={classes.markdown}>
      <ReactMarkdown
        components={{
          p: ({ node, children }: any) => {
            if (node.children[0].tagName === 'img') {
              const image = node.children[0];

              return (
                <div className={classes.image}>
                  <Image
                    src={`/images/posts/${slug}/${image.properties.src}`}
                    alt={image.alt}
                    layout="fill"
                  />
                </div>
              );
            }

            return <p>{children}</p>;
          },

          code: ({ className, children }) => {
            const language = (className || '').split('-')[1];

            return (
              <SyntaxHighlighter style={atomDark} language={language}>
                {children}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </section>
  );
};

export default Markdown;
