import Image from 'components/Image';

const Img = (slug: string) => {
  const img = ({ src, alt }: any) => {
    return <Image src={`/images/posts/${slug}/${src}`} alt={alt} />;
  };

  return img;
};
export default Img;
