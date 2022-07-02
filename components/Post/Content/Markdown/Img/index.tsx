import Image from 'components/Image';

const Img = (slug: string) => {
  const img = ({ src, alt }: any) => {
    const imagePath = `/images/posts/${slug}/${src}`;
    const parsedAlt = alt.split('?caption=');

    const altText = parsedAlt[0];
    const isCaption = parsedAlt[1] === 'true';

    return isCaption ? (
      <figure>
        <Image src={imagePath} alt={altText} />
        <figcaption>{parsedAlt[0]}</figcaption>
      </figure>
    ) : (
      <Image src={imagePath} alt={altText} />
    );
  };

  return img;
};
export default Img;
