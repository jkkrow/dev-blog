import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { HeadingProps } from 'react-markdown/lib/ast-to-react';
import rehypeRaw from 'rehype-raw';
import { PropsWithChildren, useContext } from 'react';
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

import Image from 'components/Image';
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

const LinkedHeading = (level: 1 | 2 | 3) => {
  const heading = ({ children }: PropsWithChildren<HeadingProps>) => {
    const CustomTag = `h${level}` as keyof JSX.IntrinsicElements;

    if (!children) {
      return <CustomTag>{children}</CustomTag>;
    }

    const text = children[0] as string;
    const convertedText = text
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');

    return (
      <CustomTag id={convertedText}>
        <a className={classes.hash} href={`#${convertedText}`}>
          {children}
        </a>
      </CustomTag>
    );
  };

  return heading;
};

const Markdown: React.FC<MarkdownProps> = ({ slug, content }) => {
  const { theme } = useContext(AppContext);

  const colorTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <section className={classes.markdown}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: LinkedHeading(1),
          h2: LinkedHeading(2),
          h3: LinkedHeading(3),

          a: ({ children, href }) => {
            const isHashLink = href![0] === '#';

            if (isHashLink) {
              return (
                <a className={classes.hash} href={href}>
                  {children}
                </a>
              );
            }

            return (
              <Link href={href!}>
                <a>{children}</a>
              </Link>
            );
          },

          p: ({ node, children }: any) => {
            if (node.children[0].tagName !== 'img') {
              return <p>{children}</p>;
            }

            const image = node.children[0];

            return (
              <Image
                src={`/images/posts/${slug}/${image.properties.src}`}
                alt={image.alt}
              />
            );
          },

          img: ({ src, alt }) => {
            return <Image src={`/images/posts/${slug}/${src}`} alt={alt} />;
          },

          code: ({ className, inline, children }) => {
            if (inline) {
              return <code className={classes.inline}>{children}</code>;
            }

            const language = (className || '').split('language-')[1];
            const [type, label] = language.split(':');

            return (
              <>
                {label && (
                  <div
                    className={classes.label}
                    style={colorTheme['pre[class*="language-"]']}
                  >
                    {label}
                  </div>
                )}
                <SyntaxHighlighter
                  style={colorTheme}
                  language={type}
                  customStyle={{
                    padding: '2rem 2rem 0 2rem',
                    fontSize: '1.5rem',
                    borderRadius: 0,
                  }}
                >
                  {children}
                </SyntaxHighlighter>
              </>
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
