import { useContext, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { motion } from 'framer-motion';

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
import { useTimeout } from 'hooks/timeout';
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

const Code = ({ className, inline, children }: any) => {
  const { theme } = useContext(AppContext);
  const [isCopied, setIsCopied] = useState(false);

  const [setCopyTimeout] = useTimeout();

  if (inline) {
    return <code className={classes.inline}>{children}</code>;
  }

  const colorTheme = theme === 'light' ? lightTheme : darkTheme;
  const language = (className || '').split('language-')[1];
  const [type, label] = language.split(':');

  const copyHandler = () => {
    setIsCopied(true);
    setCopyTimeout(() => setIsCopied(false), 3000);
  };

  const icon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth="2"
    >
      <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" />
      <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" />
      <motion.path
        d="M8.5 13L11.5 16L16 10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isCopied ? 1 : 0,
          opacity: isCopied ? 1 : 0,
        }}
      />
    </svg>
  );

  return (
    <div className={classes.container}>
      {label && (
        <div
          className={classes.label}
          style={colorTheme['pre[class*="language-"]']}
        >
          {label}
        </div>
      )}
      <CopyToClipboard text={children.toString()} onCopy={copyHandler}>
        <button className={classes.copy}>{icon}</button>
      </CopyToClipboard>
      <SyntaxHighlighter
        style={colorTheme}
        language={type}
        customStyle={{
          padding: '2rem 2rem 0 2rem',
          margin: 0,
          fontSize: '1.5rem',
          borderRadius: 0,
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export default Code;
