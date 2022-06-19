import { useContext } from 'react';
import { motion } from 'framer-motion';

import { AppContext } from 'context/AppContext';
import classes from './index.module.scss';

const paths = [
  'M12 3V1',
  'M18.5563 5.82843L19.9706 4.41421',
  'M21 12H23',
  'M18.5563 18.1421L19.9706 19.5563',
  'M12 21V23',
  'M5.82843 18.5563L4.41421 19.9706',
  'M3 12H1',
  'M5.82843 5.41421L4.41421 4',
];

const Theme: React.FC = () => {
  const { theme, setTheme } = useContext(AppContext);

  return theme ? (
    <button className={classes.theme} onClick={setTheme}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          animate={{
            d:
              theme === 'light'
                ? 'M14.5 16.3301C16.047 15.4369 17 13.7863 17 12C17 10.2137 16.047 8.56302 14.5 7.66987C12.953 6.77671 11.047 6.77671 9.49998 7.66987C7.95299 8.56302 7 10.2137 7 12C7 13.7863 7.95299 15.4369 9.49998 16.3301C11.047 17.2232 12.953 17.2232 14.5 16.3301Z'
                : 'M21 15.4598C19.8179 15.9944 18.5058 16.292 17.1241 16.292C11.9238 16.292 7.70804 12.0762 7.70804 6.87588C7.70804 5.49422 8.00562 4.18206 8.5402 3C5.27318 4.47747 3 7.76523 3 11.5839C3 16.7843 7.21572 21 12.4161 21C16.2348 21 19.5225 18.7268 21 15.4598Z',
          }}
          transition={{ duration: 0.5, delay: theme === 'light' ? 0 : 0.3 }}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {paths.map((d) => (
          <motion.path
            key={d}
            d={d}
            animate={{
              pathLength: theme === 'light' ? 1 : 0,
              opacity: theme === 'light' ? 1 : 0,
            }}
            transition={{
              duration: 0.3,
              delay: theme === 'light' ? 0.4 : 0,
            }}
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </button>
  ) : null;
};

export default Theme;
