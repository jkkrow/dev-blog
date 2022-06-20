import Github from 'public/icons/github.svg';
import Linkedin from 'public/icons/linkedin.svg';
import classes from './index.module.scss';

const Footer: React.FC = () => {
  return (
    <footer className={classes.footer}>
      <small>
        Copyright &copy; {new Date().getFullYear()} Junku Kim. All rights
        reserved.
      </small>

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
