import { useEffect } from "react";
import { useBlogContext } from "lib/contexts/BlogContext";
import useFetch from "hooks/useFetch";
import { Blog } from "api/models/Blog";

export default function BlogsPage() {
  const { blogs, setBlogs } = useBlogContext();
  const { data, loading } = useFetch<Blog[]>("/api/blogs");

  useEffect(() => {
    if (data) {
      setBlogs(data.flat());
    }
  }, [data, setBlogs]);

  if (loading) {
    return <p>Duke u ngarkuar...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bloget e fundit</h1>
      {blogs.map((blog: Blog) => (
        <div key={(blog as any)._id} className="border p-4 mb-2">
          <h2 className="font-bold">{blog.title}</h2>
          <p>{blog.body}</p>
        </div>
      ))}
    </div>
  );
}
