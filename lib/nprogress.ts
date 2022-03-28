import Router from 'next/router';
import nProgress from 'nprogress';

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

export const setNProgress = () => {
  Router.events.on('routeChangeStart', load);
  Router.events.on('routeChangeComplete', stop);
  Router.events.on('routeChangeError', stop);
};
