import { NextApiHandler } from 'next';

import { getFeaturedPosts } from 'lib/posts';

const handler: NextApiHandler = async (req, res) => {
  const posts = getFeaturedPosts();
  return res.json({ posts });
};

export default handler;
