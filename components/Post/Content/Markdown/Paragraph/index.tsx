import Image from 'components/Image';

const Paragraph = (slug: string) => {
  const p = ({ node, children }: any) => {
    if (node.children[0].tagName !== 'img') {
      return <p>{children}</p>;
    }

    const image = node.children[0];

    return (
      <Image
        src={`/images/posts/${slug}/${image.properties.src}`}
        alt={image.alt}
      />
    );
  };

  return p;
};

export default Paragraph;
