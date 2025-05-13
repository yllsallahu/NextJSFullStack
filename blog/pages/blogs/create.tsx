import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import CreateBlogForm from '@/components/CreateBlogForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CreateBlog() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Create Blog - Next.js Blog</title>
        <meta name="description" content="Create a new blog post" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <CreateBlogForm />
        </main>
        <Footer />
      </div>
    </>
  );
}
