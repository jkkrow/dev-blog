import Github from 'components/Icons/Github';
import Linkedin from 'components/Icons/Linkedin';
import classes from './index.module.scss';

const Footer: React.FC = () => {
  return (
    <footer className={classes.footer}>
      <small>&copy; {new Date().getFullYear()} Junku Kim.</small>

      <div className={classes.social}>
        <a
          href={process.env.NEXT_PUBLIC_GITHUB_ADDRESS}
          target="_blank"
          rel="noreferrer"
        >
          <Github />
        </a>
        <a
          href={process.env.NEXT_PUBLIC_LINKEDIN_ADDRESS}
          target="_blank"
          rel="noreferrer"
        >
          <Linkedin />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
