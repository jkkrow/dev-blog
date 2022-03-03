import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import dataJson from 'assets/data/posts.json';
import { Post, PostDetail } from 'types/post';

const postsDir = path.join(process.cwd(), 'assets', 'posts');

export const getAllPosts = (): Post[] => {
  return dataJson.sort((postA, postB) => (postA.date > postB.date ? -1 : 1));
};

export const getFeaturedPosts = (): Post[] => {
  const allPosts = getAllPosts();
  return allPosts.filter((post) => post.isFeatured);
};

export const getPostDetail = (slug: string): PostDetail => {
  const filePath = path.join(postsDir, `${slug}.md`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title,
    tag: data.tag,
    image: data.image,
    excerpt: data.excerpt,
    date: data.date,
    isFeatured: data.isFeatured,
    content,
  };
};
