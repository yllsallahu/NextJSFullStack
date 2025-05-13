import { useSession } from 'next-auth/react';
import { Blog, Comment } from 'api/models/Blog';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogCardProps {
  blog: Blog;
  onLike: (blogId: string) => void;
  onDelete?: (blogId: string) => void;
  onEdit?: (blogId: string) => void; // Add onEdit prop
}

interface CommentFormProps {
  blogId: string;
  onCommentAdded: () => void;
}

function CommentForm({ blogId, onCommentAdded }: CommentFormProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/blogs/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, content: comment })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      setComment('');
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border rounded-md p-2 text-sm"
        rows={2}
        placeholder="Add a comment..."
        disabled={isSubmitting}
      ></textarea>
      <button
        type="submit"
        className="mt-2 bg-blue-600 text-white px-3 py-1 text-sm rounded-md disabled:opacity-50"
        disabled={isSubmitting || !comment.trim()}
      >
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}

export default function BlogCard({ blog, onLike, onDelete, onEdit }: BlogCardProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const hasLiked = blog.likes?.includes(userId as string);
  const [showComments, setShowComments] = useState(false);
  const [commentsUpdated, setCommentsUpdated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // State for dropdown

  const canManage = userId === blog.author || session?.user?.isSuperUser;
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const handleCommentAdded = () => {
    setCommentsUpdated(!commentsUpdated);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {blog.image && (
        <div className="relative w-full h-48">
          <Image 
            src={blog.image} 
            alt={blog.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-6">
        <Link href={`/blogs/${blog._id}`} className="hover:text-green-600">
          <h3 className="text-xl font-bold mb-2 text-black">{blog.title}</h3>
        </Link>
        
        <div className="flex items-center justify-between text-sm text-black-500">
          <div className="flex items-center space-x-4">
            <span>By {blog.author}</span>
            {blog.createdAt && <span>{formatDate(blog.createdAt)}</span>}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike(blog._id as string)}
              className={`flex items-center space-x-1 ${
                hasLiked ? 'text-green-600' : 'text-gray-500'
              } hover:text-green-600 transition-colors`}
              disabled={!session}
              title={session ? undefined : 'Login to like'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill={hasLiked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{blog.likes?.length || 0}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>{blog.comments?.length || 0}</span>
            </button>

            {canManage && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full"
                  title="More options"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(blog._id as string);
                          setShowDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Edit Post
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(blog._id as string);
                          setShowDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Delete Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {showComments && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-lg font-semibold mb-2">Comments</h4>
            
            {blog.comments && blog.comments.length > 0 ? (
              <div className="space-y-3">
                {blog.comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm">{comment.content}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {comment.createdAt && formatDate(comment.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No comments yet.</p>
            )}
            
            {session && <CommentForm blogId={blog._id as string} onCommentAdded={handleCommentAdded} />}
            
            {!session && (
              <p className="text-sm text-gray-500 mt-3">
                Please log in to comment.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}