import Head from 'next/head';
import Router from 'next/router';
import type { AppProps } from 'next/app';
import { AnimatePresence } from 'framer-motion';
import nProgress from 'nprogress';

import Layout from 'components/Layout';
import AppContextProvider from 'context/AppContext';
import 'styles/globals.scss';
import 'styles/nprogress.scss';

let timer: any;
let state: 'loading' | 'stop';
const delay = 250;

const load = () => {
  if (state === 'loading') return;

  state = 'loading';
  timer = setTimeout(() => {
    nProgress.start();
  }, delay);
};

const stop = () => {
  state = 'stop';
  clearTimeout(timer);
  nProgress.done();
};

Router.events.on('routeChangeStart', load);
Router.events.on('routeChangeComplete', stop);
Router.events.on('routeChangeError', stop);

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
