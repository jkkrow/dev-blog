import fs from 'fs';
import { Feed } from 'feed';

import { getAllPosts } from './posts';

export const generateRssFeed = async () => {
  const posts = getAllPosts();
  const blogDomain = process.env.BLOG_DOMAIN!;
  const date = new Date();
  const author = {
    name: process.env.AUTHOR_NAME,
    email: process.env.AUTHOR_EMAIL,
    link: process.env.AUTHOR_LINK,
  };

  const feed = new Feed({
    id: blogDomain,
    title: 'Dev Blog',
    description: 'A Full Stack Web Development Blog built with NextJS',
    link: blogDomain,
    image: `${blogDomain}/icons/favicon.ico`,
    favicon: `${blogDomain}/icons/favicon.ico`,
    copyright: `All rights reserved ${date.getFullYear()}, ${author.name}`,
    updated: date,
    feedLinks: {
      json: `${blogDomain}/rss/json`,
      rss2: `${blogDomain}/rss/xml`,
    },
  });

  posts.forEach((post) => {
    const url = `${blogDomain}/posts/${post.slug}`;
    feed.addItem({
      id: url,
      link: url,
      title: post.title,
      description: post.excerpt,
      content: post.excerpt,
      image: `${blogDomain}/images/posts/${post.slug}/thumbnail.png`,
      category: post.tags.map((tag) => ({ name: tag })),
      author: [author],
      contributor: [author],
      date: new Date(post.date),
    });
  });

  fs.mkdirSync('public/rss', { recursive: true });
  fs.writeFileSync('public/rss/json', feed.json1());
  fs.writeFileSync('public/rss/xml', feed.rss2());
};
