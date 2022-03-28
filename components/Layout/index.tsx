import { Fragment } from 'react';

import Header from './Header';
import Main from './Main';

const Layout: React.FC = ({ children }) => {
  return (
    <Fragment>
      <Header />
      <Main>{children}</Main>
    </Fragment>
  );
};

export default Layout;
