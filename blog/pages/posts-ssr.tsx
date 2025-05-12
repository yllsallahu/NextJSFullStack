// pages/posts-ssr.tsx

interface Post {
  id: number;
  title: string;
  body: string;
}

export async function getServerSideProps() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
  const posts = await res.json();
  return { props: { posts } };
}

export default function PostsSSR({ posts }: { posts: Post[] }) {
  return (
    <div>
      <h1>Postimet (SSR)</h1>
      {posts.map((post: Post) => (
        <p key={post.id}>{post.title}</p>
      ))}
    </div>
  );
}
