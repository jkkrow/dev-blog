import Image from 'components/Image';

const Paragraph = (slug: string) => {
  const p = ({ node, children }: any) => {
    if (node.children[0].tagName !== 'img') {
      return <p>{children}</p>;
    }

    const image = node.children[0];
    const { src, alt } = image.properties;
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

  return p;
};

export default Paragraph;
