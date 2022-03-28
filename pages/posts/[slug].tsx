import Head from 'next/head';
import type {
  InferGetStaticPropsType,
  GetStaticProps,
  GetStaticPaths,
} from 'next';
import { Fragment } from 'react';

import PostContent from 'components/Post/Content';
import Panel from 'components/Layout/Panel';
import { PostDetail } from 'types/post';
import { getAllPosts, getPostDetail } from 'lib/posts';

interface Props {
  post: PostDetail;
}

const PostDetailPage = ({
  post,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Fragment>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.excerpt} />
      </Head>
      <PostContent post={post} />
      <Panel />
    </Fragment>
  );
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string;
  const post = getPostDetail(slug);

  return {
    props: { post },
    revalidate: 3600,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = getAllPosts();
  const paths = allPosts.map((post) => ({ params: { slug: post.slug } }));

  return {
    paths,
    fallback: false,
  };
};

export default PostDetailPage;
