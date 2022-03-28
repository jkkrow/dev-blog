import { Fragment } from 'react';

import Header from './Header';
import Main from './Main';
import Panel from './Panel';

const Layout: React.FC = ({ children }) => {
  return (
    <Fragment>
      <Header />
      <Main>{children}</Main>
      <Panel />
    </Fragment>
  );
};

export default Layout;
