import { useSession } from 'next-auth/react';
import { Blog, Comment } from '../../../api/models/Blog';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import FavoriteButtonV2 from '../FavoriteButton/FavoriteButtonV2';
import { useBlogActions } from '../../../hooks/useBlogActions';
import { useFavorites } from '../../../lib/contexts/FavoritesContext';
import toast from 'react-hot-toast';

interface BlogCardProps {
  blog: Blog;
  onLike?: (blogId: string) => Promise<any>;
  onEdit?: (blogId: string) => void;
  onDelete?: (blogId: string) => Promise<{ success?: boolean; error?: boolean; } | void>;
  onUpdate?: () => void;
  showAuthor?: boolean;
  showFavoriteButton?: boolean;
}

interface CommentFormProps {
  blogId: string;
  onCommentAdded: () => void;
}

function CommentForm({ blogId, onCommentAdded }: CommentFormProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleAddComment } = useBlogActions({ onUpdate: onCommentAdded });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await handleAddComment(blogId, comment);
      setComment('');
      onCommentAdded();
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

export default function BlogCard({ blog, onLike, onEdit, onDelete, onUpdate, showAuthor = true, showFavoriteButton = true }: BlogCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const [hasLiked, setHasLiked] = useState(blog.likes?.includes(userId as string));
  const [likeCount, setLikeCount] = useState(blog.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsUpdated, setCommentsUpdated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Blog actions hooks
  const blogActions = useBlogActions({ onUpdate });
  const handleLikeInternal = onLike || blogActions.handleLike;
  const handleDeleteInternal = onDelete || blogActions.handleDelete;
  const handleDeleteComment = blogActions.handleDeleteComment;

  // Ensure we have a valid blog ID
  const blogId = useMemo(() => {
    if (!blog.id || blog.id === 'undefined') {
      console.error('Invalid blog ID in BlogCard:', blog);
      return null;
    }
    return blog.id.toString().replace(/^new ObjectId\("(.+)"\)$/, '$1');
  }, [blog.id]);

  useEffect(() => {
    setHasLiked(blog.likes?.includes(userId as string) || false);
    setLikeCount(blog.likes?.length || 0);
  }, [userId, blog.likes]);

  useEffect(() => {
    if (session?.user?.favorites) {
      blog.isFavorited = session.user.favorites.includes(blogId);
    }
  }, [session?.user?.favorites, blogId]);

  const canManage = userId === blog.author || session?.user?.isSuperUser;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCommentAdded = () => {
    setCommentsUpdated(!commentsUpdated);
    if (onUpdate) onUpdate();
  };

  const handleLikeClick = async () => {
    if (!session) {
      const returnUrl = encodeURIComponent(router.asPath);
      router.push(`/auth/signin?callbackUrl=${returnUrl}`);
      return;
    }

    if (!blogId) {
      toast.error('Invalid blog ID');
      return;
    }

    setIsLoading(true);
    try {
      const result = await handleLikeInternal(blogId);
      if (result && !result.error) {
        setHasLiked(!hasLiked);
        setLikeCount((prev) => hasLiked ? prev - 1 : prev + 1);
        toast.success(hasLiked ? 'Like removed' : 'Blog liked!');
      } else {
        throw new Error('Failed to like blog');
      }
    } catch (error) {
      console.error('Error liking blog:', error);
      toast.error('Failed to like blog. Please try again.');
      // Revert optimistic update if needed
      setHasLiked(hasLiked);
      setLikeCount(blog.likes?.length || 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async (blogId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await handleDeleteInternal(blogId);
      if (result && !result.error) {
        toast.success('Blog deleted successfully');
      } else {
        throw new Error('Failed to delete blog');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog. Please try again.');
    } finally {
      setIsLoading(false);
    }
    setShowDropdown(false);
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(blog.id as string);
    } else {
      window.location.href = `/blogs/edit/${blog.id}`;
    }
    setShowDropdown(false);
  };

  const handleDeleteCommentClick = async (commentId: string) => {
    if (!blogId) {
      toast.error('Invalid blog ID');
      return;
    }

    setIsLoading(true);
    try {
      await handleDeleteComment(blogId, commentId);
      handleCommentAdded();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get comment key
  const getCommentKey = (comment: Comment) => {
    return comment._id ? comment._id.toString() : `temp-${Date.now()}`;
  };

  // Helper function to get comment ID for deletion
  const getCommentId = (comment: Comment) => {
    return comment._id ? comment._id.toString() : undefined;
  };

  const isFavorited = useMemo(() => {
    const favorites = session?.user?.favorites || [];
    return favorites.includes(blogId);
  }, [session?.user?.favorites, blogId]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {blog.imageUrl && (
        <div className="relative w-full h-48">
          <Image 
            src={blog.imageUrl} 
            alt={blog.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="p-4">
        {blogId ? (
          <Link href={`/blogs/${blogId}`}>
            <h2 className="text-xl text-black font-bold mb-2 hover:text-indigo-600">
              {blog.title}
            </h2>
          </Link>
        ) : (
          <h2 className="text-xl text-black font-bold mb-2">{blog.title}</h2>
        )}

        <div className="flex justify-between items-center text-black text-sm mb-4">
          <div>
            {showAuthor && <p>By {blog.author || 'Anonymous'}</p>}
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
                  <div className="py-1" role="menu">                    <button
                      onClick={handleEditClick}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit Post
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteClick(blog.id as string);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-black mb-4 line-clamp-3">{blog.content}</p>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLikeClick}
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
          
          {session && showFavoriteButton && blogId && (
            <FavoriteButtonV2 
              blogId={blogId}
              isFavorited={blog.isFavorited} // Pass favorited state
              onToggleFavorite={onUpdate}
            />
          )}
        </div>
        
        {showComments && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-lg font-semibold text-black mb-2">Comments</h4>
            
            {blog.comments && blog.comments.length > 0 ? (
              <div className="space-y-3">
                {blog.comments.map((comment) => (
                  <div key={getCommentKey(comment)} className="bg-gray-50 text-black p-3 rounded relative group">
                    <p className="text-sm">{comment.content}</p>
                    <div className="text-xs text-black mt-1 flex justify-between items-center">
                      <span>{comment.createdAt && formatDate(comment.createdAt)}</span>
                      {session?.user?.isSuperUser && (
                        <button
                          onClick={() => {
                            const commentId = getCommentId(comment);
                            if (commentId) {
                              handleDeleteCommentClick(commentId);
                            }
                          }}
                          disabled={isLoading}
                          className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50"
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
              <p className="text-sm text-black">No comments yet.</p>
            )}
            
            {session && <CommentForm blogId={blogId as string} onCommentAdded={handleCommentAdded} />}
            
            {!session && (
              <p className="text-sm text-black mt-3">
                Please <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800">log in</Link> to comment.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}