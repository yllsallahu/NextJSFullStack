// pages/posts-ssg.tsx

interface Post {
  id: number;
  title: string;
  body: string;
}

export async function getStaticProps() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
  const posts = await res.json();
  return { props: { posts } };
}

export default function PostsSSG({ posts }: { posts: Post[] }) {
  return (
    <div>
      <h1>Postimet (SSG)</h1>
      {posts.map((post: Post) => (
        <p key={post.id}>{post.title}</p>
      ))}
    </div>
  );
}
