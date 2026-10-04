import type { Metadata } from "next";
import BlogsLanding from "@/components/blogs/BlogsLanding";
import { getAllBlogs } from "@/lib/blogsServer";

export const metadata: Metadata = {
  title: "Blogs — E-Cell SRMIST",
  description: "Updates, stories, and lessons from E-Cell SRMIST.",
};

// Posts published from /admin show up within a minute (and immediately,
// since publishing also revalidates this page).
export const revalidate = 60;

export default async function BlogsPage() {
  return <BlogsLanding posts={await getAllBlogs()} />;
}
