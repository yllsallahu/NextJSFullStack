import React from 'react';
import { useUserFavorites } from '../../../hooks/useUserFavorites';
import Link from 'next/link';
import Image from 'next/image';

interface FavoritesStatsProps {
  className?: string;
}

const FavoritesStats: React.FC<FavoritesStatsProps> = ({ className = '' }) => {
  const { 
    favoriteCount, 
    recentFavorites, 
    hasAnyFavorites, 
    mostRecentFavorite,
    isLoading 
  } = useUserFavorites(3); // Get 3 most recent favorites

  if (isLoading) {
    return (
      <div className={`p-4 bg-white shadow rounded-lg ${className}`}>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Favorites</h3>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white shadow rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Favorites</h3>
      
      {hasAnyFavorites ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              You have <span className="font-semibold">{favoriteCount}</span> favorite {favoriteCount === 1 ? 'blog' : 'blogs'}
            </p>
            <Link href="/favorites" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
          
          {mostRecentFavorite && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-500 mb-2">Most recent favorite:</p>
              <Link href={`/blogs/${mostRecentFavorite._id}`} className="group">
                <div className="flex items-center space-x-3">
                  {mostRecentFavorite.image && (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image 
                        src={mostRecentFavorite.image}
                        alt={mostRecentFavorite.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                      {mostRecentFavorite.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {mostRecentFavorite.createdAt && new Date(mostRecentFavorite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {recentFavorites.length > 1 && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-500 mb-2">Other recent favorites:</p>
              <ul className="space-y-2">
                {recentFavorites.slice(1).map(blog => (
                  <li key={blog._id} className="text-sm">
                    <Link href={`/blogs/${blog._id}`} className="text-gray-700 hover:text-blue-600 transition-colors">
                      {blog.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 mx-auto text-gray-300 mb-3" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" 
            />
          </svg>
          <p className="text-gray-500">You haven't favorited any blogs yet.</p>
          <Link 
            href="/blogs" 
            className="mt-3 inline-block px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Browse Blogs
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesStats;
