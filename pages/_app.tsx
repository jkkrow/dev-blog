import Head from 'next/head';
import type { AppProps } from 'next/app';
import { AnimatePresence } from 'framer-motion';

import Layout from 'components/Layout';
import AppContextProvider from 'context/AppContext';
import { useNprogress } from 'hooks/nprogress';
import { useTransitionFix } from 'hooks/transition-fix';
import 'styles/globals.scss';
import 'styles/nprogress.scss';

const MyApp = ({ Component, pageProps, router }: AppProps) => {
  useNprogress();
  useTransitionFix(1000);

  return (
    <AppContextProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout>
        <AnimatePresence initial={false} exitBeforeEnter>
          <Component {...pageProps} key={router.route} />
        </AnimatePresence>
      </Layout>
    </AppContextProvider>
  );
};

export default MyApp;
