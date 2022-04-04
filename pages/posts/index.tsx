import Head from 'next/head';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { Fragment } from 'react';

import PostGrid from 'components/Post/Grid';
import { Post } from 'types/post';
import { getAllPosts, getPostsByTags } from 'lib/posts';

interface Props {
  posts: Post[];
  loading: boolean;
}

const PostsPage = ({
  posts,
  loading,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { query } = useRouter();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Fragment>
      <Head>
        <title>{query.tags ? `Posts - #${query.tags}` : 'All Posts'}</title>
        <meta
          name="description"
          content="A list of web development related posts"
        />
      </Head>
      <PostGrid posts={posts} label={query.tags ? '' : 'All Posts'} />
    </Fragment>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
}) => {
  if (!query) {
    return {
      props: { posts: [], loading: true },
    };
  }

  if (!query.tags) {
    const posts = getAllPosts();
    return {
      props: { posts, loading: false },
    };
  }

  const posts = getPostsByTags(query.tags);
  return {
    props: { posts, loading: false },
  };
};

export default PostsPage;
