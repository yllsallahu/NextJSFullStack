import React, { useState, useEffect } from 'react';
import { useUserFavorites } from '../../../hooks/useUserFavorites';
import { useBlogFavorites } from '../../../hooks/useBlogFavorites';
import { useFavorites } from '../../../lib/contexts/FavoritesContext';
import { Blog } from '../../../api/models/Blog';
import Link from 'next/link';
import Image from 'next/image';

interface FavoritesOverviewProps {
  className?: string;
}

// Component to demonstrate different ways to use our favorites hooks
const FavoritesOverview: React.FC<FavoritesOverviewProps> = ({ className = '' }) => {
  // Using the Context API directly
  const contextFavorites = useFavorites();
  
  // Using our specialized custom hooks
  const userFavorites = useUserFavorites(5); // Get top 5 recent favorites
  const blogFavorites = useBlogFavorites();
  
  // Local state
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [filteredFavorites, setFilteredFavorites] = useState<Blog[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Extract all unique tags from favorites
  useEffect(() => {
    if (!contextFavorites.favorites.length) return;
    
    const tags: string[] = [];
    contextFavorites.favorites.forEach(blog => {
      if (blog.tags) {
        blog.tags.forEach(tag => {
          if (!tags.includes(tag)) {
            tags.push(tag);
          }
        });
      }
    });
    
    setAvailableTags(tags);
  }, [contextFavorites.favorites]);
  
  // Filter favorites by selected tag
  useEffect(() => {
    if (!selectedTag) {
      setFilteredFavorites(userFavorites.recentFavorites);
      return;
    }
    
    const filtered = userFavorites.getFavoritesByTag(selectedTag);
    setFilteredFavorites(filtered);
  }, [selectedTag, userFavorites]);
  
  // Handle tag filter change
  const handleTagChange = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag); // Toggle the selected tag
  };
  
  // Handle removing a blog from favorites
  const handleRemoveFromFavorites = async (blogId: string) => {
    await userFavorites.removeFromFavorites(blogId);
  };
  
  // Loading state
  if (contextFavorites.isLoading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Favorites Overview</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  // No favorites state
  if (!userFavorites.hasAnyFavorites) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Favorites Overview</h2>
        <div className="text-center py-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto text-gray-300 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
            />
          </svg>
          <p className="text-gray-500 mb-4">You haven't added any blogs to your favorites yet.</p>
          <Link 
            href="/blogs" 
            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Discover Blogs
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Favorites Overview</h2>
      
      {/* Favorites stats from combined hooks */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Your Favorites Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{userFavorites.favoriteCount}</p>
            <p className="text-xs text-gray-500">Total Favorite Blogs</p>
          </div>
          {availableTags.length > 0 && (
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-2xl font-bold text-green-600">{availableTags.length}</p>
              <p className="text-xs text-gray-500">Unique Tags</p>
            </div>
          )}
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-2xl font-bold text-purple-600">
              {new Date(userFavorites.mostRecentFavorite?.createdAt || new Date()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs text-gray-500">Last Added Favorite</p>
          </div>
        </div>
      </div>
      
      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Filter by Tag</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-1 text-xs rounded-full transition-colors
                  ${selectedTag === tag 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Favorites list */}
      <h3 className="text-sm font-medium text-gray-500 mb-2">
        {selectedTag ? `Favorites tagged with "${selectedTag}"` : 'Recent Favorites'}
      </h3>
      <div className="space-y-4">
        {filteredFavorites.length > 0 ? (
          filteredFavorites.filter(blog => blog.id && blog.id.trim() !== '').map(blog => (
            <div key={blog.id} className="flex items-start border-b pb-4 last:border-b-0 group">
              {/* Blog image thumbnail */}
              {blog.imageUrl && (
                <div className="relative w-16 h-16 flex-shrink-0 mr-3">
                  <Image 
                    src={blog.imageUrl} 
                    alt={blog.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}
              
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                  <Link 
                    href={`/blogs/${blog.id}`} 
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate mr-2"
                  >
                    {blog.title}
                  </Link>
                  <button
                    onClick={() => handleRemoveFromFavorites(blog.id || '')}
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remove from favorites"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 truncate mb-1">{blog.content.substring(0, 100)}...</p>
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {blog.tags.map((tag: string) => (
                      <span 
                        key={tag} 
                        className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            No favorites matching your filter. Try selecting a different tag.
          </p>
        )}
      </div>
      
      <div className="mt-6 text-center">
        <Link 
          href="/favorites" 
          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          View All Favorites
        </Link>
      </div>
    </div>
  );
};

export default FavoritesOverview;
