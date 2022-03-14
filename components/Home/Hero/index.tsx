import classes from './index.module.scss';

const Hero: React.FC = () => {
  return (
    <section className={classes.hero}>
      <h1>Dev Blog</h1>
      <p>
        Fullstack Web Development Blog including React, Node, Express, MongoDB
        and AWS services.
      </p>
    </section>
  );
};

export default Hero;
