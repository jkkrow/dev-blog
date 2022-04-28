import NextImage from 'next/image';
import { useState } from 'react';

import classes from './index.module.scss';

interface ImageProps {
  src: string;
  alt?: string;
}

const Image: React.FC<ImageProps> = ({ src, alt }) => {
  const [ratio, setRatio] = useState('16 / 9');

  return (
    <div className={classes.image} style={{ aspectRatio: ratio }}>
      <NextImage
        src={src}
        alt={alt}
        layout="fill"
        onLoadingComplete={({ naturalWidth, naturalHeight }) =>
          setRatio(`${naturalWidth} / ${naturalHeight}`)
        }
      />
    </div>
  );
};

export default Image;
