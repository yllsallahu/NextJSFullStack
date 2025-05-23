import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Blog, Comment } from 'api/models/Blog';

export default function BlogDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch blog details
  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blogs/${id}`);
      if (!res.ok) throw new Error('Failed to fetch blog');
      const data = await res.json();
      setBlog(data);
    } catch (err) {
      console.error('Error fetching blog:', err);
      setError('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' })
      });

      if (!res.ok) throw new Error('Failed to like blog');
      fetchBlog(); // Refresh blog data
    } catch (err) {
      console.error('Error liking blog:', err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!comment.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await fetch('/api/blogs/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogId: id,
          content: comment
        })
      });

      if (!res.ok) throw new Error('Failed to add comment');
      setComment('');
      fetchBlog(); // Refresh to show new comment
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete blog');
      router.push('/blogs');
    } catch (err) {
      console.error('Error deleting blog:', err);
    }
  };

  const formatDate = (dateString?: Date) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Blog not found'}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const userCanEdit = session?.user?.id === blog.author || session?.user?.isSuperUser;
  const userHasLiked = blog.likes?.includes(session?.user?.id as string);

  return (
    <>
      <Head>
        <title>{blog.title} - Next.js Blog</title>
        <meta name="description" content={blog.content.substring(0, 160)} />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
              <div className="flex items-center text-gray-600 mb-6">
              <p className="mr-4">By {blog.authorName || 'Anonymous'}</p>
              <p>{formatDate(blog.createdAt)}</p>
            </div>

            {blog.image && (
              <div className="relative w-full h-96 mb-8">
                <Image 
                  src={blog.image} 
                  alt={blog.title}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </div>
            )}

            <div className="prose max-w-none mb-8">
              <p className="whitespace-pre-wrap">{blog.content}</p>
            </div>

            <div className="flex items-center space-x-4 mb-8">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
                  userHasLiked
                    ? 'bg-green-50 border-green-500 text-green-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                disabled={!session}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={userHasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{blog.likes?.length || 0} likes</span>
              </button>

              {userCanEdit && (
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full border border-red-300 text-red-600 hover:bg-red-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="mt-10">
              <h3 className="text-xl font-bold mb-4">Comments ({blog.comments?.length || 0})</h3>
              
              {session ? (
                <form onSubmit={handleComment} className="mb-6">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border rounded-md p-3"
                    rows={3}
                    placeholder="Add a comment..."
                    disabled={submittingComment}
                  ></textarea>
                  <button
                    type="submit"
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                    disabled={submittingComment || !comment.trim()}
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              ) : (
                <p className="mb-6 text-gray-600">
                  Please <a href="/auth/signin" className="text-green-600 hover:underline">sign in</a> to comment.
                </p>
              )}

              <div className="space-y-4">
                {blog.comments && blog.comments.length > 0 ? (
                  blog.comments.map((comment: Comment) => (                    <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                      <p className="mb-2">{comment.content}</p>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <p className="font-medium">{comment.authorName || 'Anonymous'}</p>
                          <span className="mx-2">•</span>
                          <p>{comment.createdAt && formatDate(comment.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
