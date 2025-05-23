import { useSession } from 'next-auth/react';
import { Blog, Comment } from 'api/models/Blog';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogCardProps {
  blog: Blog;
  onLike?: (blogId: string) => void;
  onDelete?: (blogId: string) => void;
  onEdit?: (blogId: string) => void;
  onUpdate?: () => void;
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
        className="w-full border rounded-md p-2 text-sm text-black"
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

export default function BlogCard({ blog, onDelete, onEdit, onUpdate }: BlogCardProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [hasLiked, setHasLiked] = useState(blog.likes?.includes(userId as string));
  const [likeCount, setLikeCount] = useState(blog.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsUpdated, setCommentsUpdated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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

  const handleLike = async () => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/signin';
      return;
    }

    if (isLiking) return; // Prevent double clicks

    try {
      setIsLiking(true);
      const res = await fetch('/api/blogs/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId: blog._id })
      });

      if (!res.ok) throw new Error('Failed to like blog');

      const { likes } = await res.json();
      setHasLiked(!hasLiked);
      setLikeCount(likes.length);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error liking blog:', error);
    } finally {
      setIsLiking(false);
    }
  };
  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user?.isSuperUser) return;
    
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/blogs/comments/${blog._id}/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      // Update local state to remove the comment
      const updatedBlog = {
        ...blog,
        comments: blog.comments?.filter(comment => comment._id !== commentId) || []
      };

      // Update the blog state immutably
      onUpdate?.(); // Trigger parent update if provided
      handleCommentAdded(); // Refresh comments
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
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
      
      <div className="p-4">
        <Link href={`/blogs/${blog._id}`}>
          <h2 className="text-xl text-black font-bold mb-2 hover:text-indigo-600">
            {blog.title}
          </h2>
        </Link>
        
        <div className="flex justify-between items-center text-black text-sm mb-4">          <div>
            <p>By {blog.authorName || 'Anonymous'}</p>
            <p>{blog.createdAt && formatDate(blog.createdAt)}</p>
          </div>
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
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
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-black mb-4 line-clamp-3">{blog.content}</p>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-1 ${
              hasLiked ? 'text-red-500' : 'text-black'
            } hover:text-red-500 transition-colors`}
          >
            <svg
              className={`h-5 w-5 ${hasLiked ? 'fill-current' : 'stroke-current'}`}
              viewBox="0 0 24 24"
              fill={hasLiked ? 'currentColor' : 'none'}
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-black hover:text-gray-700"
          >
            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{blog.comments?.length || 0}</span>
          </button>
        </div>
        
        {showComments && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-lg font-semibold text-black mb-2">Comments</h4>
            
            {blog.comments && blog.comments.length > 0 ? (
              <div className="space-y-3">
                {blog.comments.map((comment) => (                  <div key={comment._id} className="bg-gray-50 text-black p-3 rounded relative group">
                    <p className="text-sm">{comment.content}</p>
                    <div className="text-xs text-black mt-1 flex justify-between items-center">
                      <div>
                        <span className="font-medium">{comment.authorName || 'Anonymous'}</span>
                        <span className="mx-1">•</span>
                        <span>{comment.createdAt && formatDate(comment.createdAt)}</span>
                      </div>
                      {session?.user?.isSuperUser && (
                        <button
                          onClick={() => handleDeleteComment(comment._id as string)}
                          className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Delete comment"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-black text-sm">No comments yet.</p>
            )}
            
            {session && <CommentForm blogId={blog._id as string} onCommentAdded={handleCommentAdded} />}
            
            {!session && (
              <p className="text-sm text-black mt-3">
                Please log in to comment.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}