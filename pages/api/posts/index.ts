import { NextApiHandler } from 'next';

import { getAllPosts } from 'lib/posts';

const handler: NextApiHandler = async (req, res) => {
  const posts = getAllPosts();
  return res.json({ posts });
};

export default handler;
