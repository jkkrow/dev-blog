import Head from 'next/head';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { Fragment } from 'react';

import Hero from 'components/Hero';
import PostGrid from 'components/Post/Grid';
import { Post } from 'types/post';
import { getFeaturedPosts } from 'lib/posts';

interface Props {
  posts: Post[];
}

const HomePage = ({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Fragment>
      <Head>
        <title>Blog</title>
        <meta name="description" content="Fullstack web development blog" />
      </Head>
      <Hero />
      <PostGrid posts={posts} label="Featured Posts" />
    </Fragment>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = getFeaturedPosts();

  return {
    props: { posts },
  };
};

export default HomePage;
