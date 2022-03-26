import { motion } from 'framer-motion';

import classes from './index.module.scss';

const Hero: React.FC = () => {
  return (
    <motion.section
      className={classes.hero}
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ ease: 'easeOut' }}
    >
      <h1>Dev Blog</h1>
      <p>
        Fullstack Web Development Blog including React, Node, Express, MongoDB
        and AWS services.
      </p>
    </motion.section>
  );
};

export default Hero;
