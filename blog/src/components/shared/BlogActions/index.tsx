import React, { useState, useEffect } from 'react';
import { useBlogFavorites } from '../../../hooks/useBlogFavorites';
import { Blog } from '../../../api/models/Blog';
import Link from 'next/link';
import Image from 'next/image';

interface BlogActionsProps {
  blog: Blog;
  className?: string;
}

const BlogActions: React.FC<BlogActionsProps> = ({ blog, className = '' }) => {
  const [comment, setComment] = useState('');
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const {
    setCurrentBlog,
    isActiveBlogFavorited,
    toggleActiveBlogFavorite,
    toggleActiveBlogLike,
    commentOnActiveBlog,
    deleteActiveBlog,
    getRelatedFavorites,
    isLoading
  } = useBlogFavorites();
  
  // Set current blog when component mounts or blog changes
  useEffect(() => {
    setCurrentBlog(blog);
  }, [blog, setCurrentBlog]);
  
  // Get related favorites when component mounts
  useEffect(() => {
    const related = getRelatedFavorites();
    // Filter out the current blog from related blogs
    setRelatedBlogs(related.filter(b => b.id !== blog.id));
  }, [blog.id, getRelatedFavorites]);
  
  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isLoading) return;
    
    await commentOnActiveBlog(comment);
    setComment('');
  };
  
  return (
    <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {/* Like button */}
        <button
          onClick={toggleActiveBlogLike}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-2 text-sm border rounded-md transition-colors hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill={blog.likes?.includes('currentUser') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Like{blog.likes && blog.likes.length > 0 && ` (${blog.likes.length})`}</span>
        </button>
        
        {/* Favorite button */}
        <button
          onClick={toggleActiveBlogFavorite}
          disabled={isLoading}
          className={`flex items-center space-x-1 px-3 py-2 text-sm border rounded-md transition-colors
            ${isActiveBlogFavorited 
              ? 'bg-yellow-50 text-yellow-600 border-yellow-200' 
              : 'hover:bg-gray-50'
            }`}
        >
          <svg className="w-4 h-4" fill={isActiveBlogFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span>{isActiveBlogFavorited ? 'Favorited' : 'Add to Favorites'}</span>
        </button>
        
        {/* Delete button (if owner) */}
        {blog.author === 'currentUser' && (
          <button
            onClick={deleteActiveBlog}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-md transition-colors hover:bg-red-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        )}
      </div>
      
      {/* Comment form */}
      <form onSubmit={handleCommentSubmit} className="mt-4">
        <div className="mb-2">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            Add a comment
          </label>
          <textarea
            id="comment"
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={isLoading || !comment.trim()}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
      
      {/* Related blogs from same author */}
      {relatedBlogs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">More by this author in your favorites:</h3>
          <ul className="space-y-2">
            {relatedBlogs.filter(blog => blog.id && blog.id.trim() !== '').map(relatedBlog => (
              <li key={relatedBlog.id} className="text-sm flex items-center">
                <svg className="w-3 h-3 text-yellow-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <Link 
                  href={`/blogs/${relatedBlog.id}`} 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {relatedBlog.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BlogActions;
