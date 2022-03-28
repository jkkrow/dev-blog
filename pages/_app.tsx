import Head from 'next/head';
import type { AppProps } from 'next/app';
import { AnimatePresence } from 'framer-motion';

import Layout from 'components/Layout';
import AppContextProvider from 'context/AppContext';
import { setNProgress } from 'lib/nprogress';
import { setTransitionFixTimeout } from 'lib/transition-fix';
import 'styles/globals.scss';
import 'styles/nprogress.scss';

setNProgress();
setTransitionFixTimeout(1000);

const MyApp = ({ Component, pageProps, router }: AppProps) => {
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
