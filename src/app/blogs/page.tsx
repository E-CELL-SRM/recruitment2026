import type { Metadata } from "next";
import BlogsLanding from "@/components/blogs/BlogsLanding";

export const metadata: Metadata = {
  title: "Blogs — E-Cell SRMIST",
  description: "Updates, stories, and lessons from E-Cell SRMIST.",
};

export default function BlogsPage() {
  return <BlogsLanding />;
}
