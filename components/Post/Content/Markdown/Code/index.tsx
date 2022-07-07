import { useContext, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
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

import Clipboard from 'components/Icons/Clipboard';
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
        <button className={classes.copy}>
          <Clipboard isCopied={isCopied} />
        </button>
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
