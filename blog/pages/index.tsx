import { useSession } from "next-auth/react";
import Link from "next/link";
import useFetch from "hooks/useFetch";
import type { Blog } from "api/models/Blog";
import BlogCard from "components/shared/BlogCard";
import Header from "components/Header";
import Footer from "components/Footer";
import { useRouter } from "next/router"; // Import useRouter

export default function HomePage() {
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

  const handleEdit = (blogId: string) => {
    router.push(`/blogs/edit/${blogId}`); // Navigate to the edit page
  };

  // Get only the 3 most recent blogs for the homepage
  const featuredBlogs = blogs?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-green-600 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mirë se vini në Blog
            </h1>
            <p className="text-xl mb-8">
              Lexoni dhe ndani mendimet tuaja me komunitetin tonë.
            </p>
            {!session && (
              <Link
                href="/auth/signin"
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Bashkohu Tani
              </Link>
            )}
          </div>
        </div>

        {/* Featured Blogs Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Bloget e Fundit</h2>
            <Link
              href="/blogs"
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Shiko të gjitha →
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Gabim gjatë ngarkimit të blogeve: {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBlogs.map((blog: Blog) => (
                <BlogCard
                  key={blog._id}
                  blog={blog}
                  onLike={handleLike}
                  // Add onEdit and onDelete if the user can manage the post
                  onEdit={session?.user?.id === blog.author || session?.user?.isSuperUser ? handleEdit : undefined}
                  onDelete={session?.user?.id === blog.author || session?.user?.isSuperUser ? async (id) => {
                    if (!window.confirm("A jeni të sigurt që dëshironi ta fshini këtë blog?")) return;
                    try {
                      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
                      if (!res.ok) throw new Error("Failed to delete blog");
                      mutate(); // Re-fetch blogs after deletion
                    } catch (err) {
                      console.error("Error deleting blog:", err);
                    }
                  } : undefined}
                />
              ))}
            </div>
          )}

          {!loading && featuredBlogs.length === 0 && (
            <p className="text-center text-gray-600">Nuk ka poste për të shfaqur.</p>
          )}
        </div>

        {/* Call to Action Section */}
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {session?.user?.name ? "Dëshironi të krijoni një blog?" : "Dëshironi të merrni pjesë?"}
            </h2>
            <p className="text-gray-600 mb-8">
              {session?.user?.name
                ? "Ndani mendimet tuaja me komunitetin tonë."
                : "Regjistrohuni për të ndarë mendimet tuaja dhe për të pëlqyer postimet."}
            </p>
            <Link
              href={session?.user?.name ? "/blogs" : "/sign-up"}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              {session?.user?.name ? "Krijo Blog" : "Regjistrohu"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
