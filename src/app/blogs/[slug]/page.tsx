import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogView from "@/components/blogs/BlogView";
import { getAllBlogs } from "@/lib/blogsServer";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getAllBlogs()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getAllBlogs()).find((b) => b.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — E-Cell SRMIST`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const posts = await getAllBlogs();
  const post = posts.find((b) => b.slug === slug);
  if (!post) notFound();
  return <BlogView post={post} posts={posts} />;
}
