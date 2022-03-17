import Head from 'next/head';
import Router from 'next/router';
import type { AppProps } from 'next/app';
import nProgress from 'nprogress';

import Layout from 'components/Layout';
import AppContextProvider from 'context/AppContext';
import 'styles/globals.scss';
import 'styles/nprogress.scss';

Router.events.on('routeChangeStart', nProgress.start);
Router.events.on('routeChangeComplete', nProgress.done);
Router.events.on('routeChangeError', nProgress.done);

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <AppContextProvider>
      <Layout>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Component {...pageProps} />
      </Layout>
    </AppContextProvider>
  );
};

export default MyApp;
