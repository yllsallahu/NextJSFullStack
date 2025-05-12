import useFetch from "hooks/useFetch";

interface Post {
  id: number;
  title: string;
  body: string;
}

export default function Posts() {
  const { data: posts, loading, error } = useFetch<Post>("/api/posts");

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Gabim gjatë ngarkimit të postimeve: {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Postimet</h2>
      <div className="space-y-4">
        {posts?.map((post) => (
          <div key={post.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
            <p className="text-gray-600">{post.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
