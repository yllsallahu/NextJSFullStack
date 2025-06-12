import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import Header from 'components/Header';
import Footer from 'components/Footer';
import type { Blog } from 'api/models/Blog';

export default function EditBlogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id: blogId } = router.query;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading' || !blogId) return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchBlogAndCheckAuth = async () => {
      try {
        const res = await fetch(`/api/blogs/${blogId}`);
        if (!res.ok) throw new Error('Failed to fetch blog');
        const blog = await res.json();
        
        // Only allow the author or superusers to edit
        if (blog.author !== session?.user?.id && !session?.user?.isSuperUser) {
          router.push('/blogs');
          return;
        }

        // If authorized, set the blog data
        setTitle(blog.title);
        setContent(blog.content);
        setCurrentImageUrl(blog.imageUrl || null);
        setImageUrl(blog.imageUrl || '');
        setIsLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load blog');
        setIsLoading(false);
      }
    };

    fetchBlogAndCheckAuth();
  }, [blogId, router, session, status]);

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setError(''); // Clear previous errors
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const finalImageUrl = imageUrl || null;

      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content,
          image: finalImageUrl 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update blog post');
      }

      router.push(`/blogs/${blogId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
            <p>Please sign in to edit blog posts.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !title && !content) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            <p>{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Blog Post</title>
        <meta name="description" content="Edit your blog post" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Blog Post</h1>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="imageUrl" className="block text-gray-700 font-medium mb-2">
                  Featured Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter a direct URL to an image. File uploads are currently disabled in production.
                </p>
                {imageUrl && (
                  <div className="mt-4 relative w-full h-48">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover rounded-md"
                      onError={() => setError('Invalid image URL')}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
