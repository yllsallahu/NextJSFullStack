// pages/posts-isr.tsx

interface Post {
  id: number;
  title: string;
  body: string;
}

export async function getStaticProps() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
  const posts = await res.json();
  return {
    props: { posts },
    revalidate: 10, // faqja do rifreskohet çdo 10 sekonda
  };
}

export default function PostsISR({ posts }: { posts: Post[] }) {
  return (
    <div>
      <h1>Postimet (ISR)</h1>
      {posts.map((post: Post) => (
        <p key={post.id}>{post.title}</p>
      ))}
    </div>
  );
}
