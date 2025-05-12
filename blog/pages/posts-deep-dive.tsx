// pages/posts-deep-dive.tsx

interface Post {
  id: number;
  title: string;
  body: string;
}

export async function getStaticProps() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  const posts = await res.json();
  return {
    props: { posts },
    revalidate: 10, // rifreskon faqen çdo 10 sekonda
  };
}

export default function PostsDeepDive({ posts }: { posts: Post[] }) {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Postet (ISR Deep Dive)</h1>
      <ul>
        {posts.slice(0, 5).map((post: Post) => (
          <li key={post.id} className="mb-2">
            {post.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
