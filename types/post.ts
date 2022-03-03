export interface Post {
  slug: string;
  title: string;
  tag: string[];
  image: string;
  excerpt: string;
  date: string;
  isFeatured: boolean;
}

export interface PostDetail extends Post {
  content: string;
}
