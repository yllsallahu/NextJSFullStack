import { useSession } from "next-auth/react";
import Header from "components/Header";
import Footer from "components/Footer";
import useFetch from "hooks/useFetch";
import type { Blog } from "api/models/Blog";

export default function HomePage() {
  const { data: session } = useSession();
  const { data: blogs, loading, error } = useFetch<Blog>("/api/blogs");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Bloget e Fundit</h1>
        
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Gabim gjatë ngarkimit të blogeve: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs?.map((blog) => (
            <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{blog.title}</h2>
                <p className="text-gray-600 line-clamp-3">{blog.body}</p>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    {new Date(blog.createdAt || "").toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && blogs?.length === 0 && (
          <p className="text-center text-gray-600">Nuk ka poste për të shfaqur.</p>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
