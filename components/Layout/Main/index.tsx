import classes from './index.module.scss';

const Main: React.FC = ({ children }) => {
  return <main className={classes.main}>{children}</main>;
};

export default Main;
