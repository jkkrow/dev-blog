import Head from 'next/head';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { Fragment } from 'react';

import PostGrid from 'components/Post/Grid';
import { Post } from 'types/post';
import { getAllPosts } from 'lib/posts-util';

interface Props {
  posts: Post[];
}

const PostsPage = ({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Fragment>
      <Head>
        <title>All Posts</title>
        <meta
          name="description"
          content="A list of web development related posts"
        />
      </Head>
      <PostGrid posts={posts} label="All Posts" />
    </Fragment>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = getAllPosts();

  return {
    props: { posts },
  };
};

export default PostsPage;
