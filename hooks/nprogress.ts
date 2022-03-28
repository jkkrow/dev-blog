import Router from 'next/router';
import nprogress from 'nprogress';
import { useEffect } from 'react';

let timer: any;
let state: 'loading' | 'stop';
const delay = 250;

const load = () => {
  if (state === 'loading') return;

  state = 'loading';
  timer = setTimeout(() => {
    nprogress.start();
  }, delay);
};

const stop = () => {
  state = 'stop';
  clearTimeout(timer);
  nprogress.done();
};

export const useNprogress = () => {
  useEffect(() => {
    Router.events.on('routeChangeStart', load);
    Router.events.on('routeChangeComplete', stop);
    Router.events.on('routeChangeError', stop);

    return () => {
      Router.events.off('routeChangeStart', load);
      Router.events.off('routeChangeComplete', stop);
      Router.events.off('routeChangeError', stop);
    };
  }, []);
};
