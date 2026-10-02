import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogView from "@/components/blogs/BlogView";
import { BLOGS, getBlog } from "@/lib/blogs";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOGS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlog((await params).slug);
  if (!post) return {};
  return {
    title: `${post.title} — E-Cell SRMIST`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = getBlog((await params).slug);
  if (!post) notFound();
  return <BlogView post={post} />;
}
