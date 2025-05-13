import { useSession } from "next-auth/react";
import Link from "next/link";
import useFetch from "hooks/useFetch";
import type { Blog } from "api/models/Blog";
import BlogCard from "components/shared/BlogCard";
import Header from "components/Header";
import Footer from "components/Footer";
import { useRouter } from "next/router"; // Import useRouter

export default function BlogsPage() {
  const { data: session } = useSession();
  const { data: blogs = [], loading, error, mutate } = useFetch<Blog[]>("/api/blogs");
  const router = useRouter(); // Initialize useRouter

  const handleLike = async (blogId: string) => {
    try {
      const res = await fetch(`/api/blogs/${blogId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" })
      });

      if (!res.ok) throw new Error("Failed to like blog");
      mutate();
    } catch (error) {
      console.error("Error liking blog:", error);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!window.confirm("A jeni të sigurt që dëshironi ta fshini këtë blog?")) {
      return;
    }

    try {
      const res = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete blog");
      mutate();
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  const handleEdit = (blogId: string) => {
    router.push(`/blogs/edit/${blogId}`); // Navigate to the edit page
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">All Blogs</h1>
          {session && (
            <Link
              href="/blogs/create"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Blog
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error loading blogs: {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard
                key={blog._id}
                blog={blog}
                onLike={handleLike}
                onDelete={session?.user?.id === blog.author || session?.user?.isSuperUser ? handleDelete : undefined}
                onEdit={session?.user?.id === blog.author || session?.user?.isSuperUser ? handleEdit : undefined} // Pass handleEdit
              />
            ))}
          </div>
        )}

        {!loading && blogs.length === 0 && (
          <p className="text-center text-gray-600">No blogs to display.</p>
        )}
      </main>

      <Footer />
    </div>
  );
}
