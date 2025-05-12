import useFetch from "hooks/useFetch";

export default function Posts() {
  const { data: posts, loading } = useFetch(
    "https://jsonplaceholder.typicode.com/posts"
  );

  if (loading) return <p>Duke u ngarkuar...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Postimet</h2>
      {posts?.map((post) => (
        <div key={post.id} className="border p-4 mb-2">
          <h3 className="font-bold">{post.title}</h3>
          <p>{post.body}</p>
        </div>
      ))}
    </div>
  );
}
