import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useContext } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';

import darkTheme from 'react-syntax-highlighter/dist/cjs/styles/prism/vs-dark';
import lightTheme from 'react-syntax-highlighter/dist/cjs/styles/prism/prism';

import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import scss from 'react-syntax-highlighter/dist/cjs/languages/prism/scss';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';

import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

darkTheme['class-name'].textDecoration = 'none';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('scss', scss);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);

interface MarkdownProps {
  slug: string;
  content: string;
}

const Markdown: React.FC<MarkdownProps> = ({ slug, content }) => {
  const { theme } = useContext(AppContext);

  const colorTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <section className={classes.markdown}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
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

          img: ({ src, alt }) => {
            return (
              <div className={classes.image}>
                <Image
                  src={`/images/posts/${slug}/${src}`}
                  alt={alt}
                  layout="fill"
                />
              </div>
            );
          },

          code: ({ className, inline, children }) => {
            const language = (className || '').split('-')[1];

            return !inline ? (
              <SyntaxHighlighter
                style={colorTheme}
                language={language}
                customStyle={{
                  padding: '2rem 2rem 0 2rem',
                  fontSize: '1.5rem',
                  borderRadius: '5px',
                }}
              >
                {children}
              </SyntaxHighlighter>
            ) : (
              <code
                style={{
                  ...colorTheme['pre[class*="language-"]'],
                  padding: '0.25rem 0.5rem',
                  fontSize: '1.5rem',
                  borderRadius: '5px',
                }}
              >
                {children}
              </code>
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
