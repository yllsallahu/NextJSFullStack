import React from 'react';
import { useFavoriteStats } from '@/hooks/useFavoriteStats';
import Link from 'next/link';

interface FavoritesAnalyticsProps {
  className?: string;
}

const FavoritesAnalytics: React.FC<FavoritesAnalyticsProps> = ({ className = '' }) => {
  const {
    count,
    addedToday,
    removedToday,
    commonTags,
    favoriteAuthors,
    favoritesByMonth,
    mostFavorited,
    isLoading
  } = useFavoriteStats();

  if (isLoading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Your Favorites Analytics</h2>
        <div className="animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Your Favorites Analytics</h2>
        <div className="text-center py-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-500 mb-3">No favorites data to analyze yet.</p>
          <p className="text-gray-400 text-sm mb-4">
            Start adding blogs to your favorites to see analytics.
          </p>
          <Link
            href="/blogs"
            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Browse Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Your Favorites Analytics</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 mb-1">Total Favorites</p>
          <p className="text-2xl font-bold text-blue-800">{count}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 mb-1">Added Today</p>
          <p className="text-2xl font-bold text-green-800">{addedToday}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg">
          <p className="text-sm text-amber-600 mb-1">Removed Today</p>
          <p className="text-2xl font-bold text-amber-800">{removedToday}</p>
        </div>
      </div>

      {/* Top tags */}
      {commonTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Most Common Tags</h3>
          <div className="flex flex-wrap gap-2">
            {commonTags.map(({ tag, count }) => (
              <div 
                key={tag} 
                className="bg-gray-100 px-3 py-1 rounded-full flex items-center"
              >
                <span className="text-gray-800">{tag}</span>
                <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite authors */}
      {favoriteAuthors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Favorite Authors</h3>
          <div className="space-y-2">
            {favoriteAuthors.map(({ author, count }) => (
              <div key={author} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="font-medium">{author}</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {count} blog{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites by month */}
      {favoritesByMonth.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Favorites by Month</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="h-40 flex items-end justify-between">
              {favoritesByMonth.map(({ month, count }, index) => {
                // Simple scaling for the chart
                const maxCount = Math.max(...favoritesByMonth.map(item => item.count));
                const height = count === 0 ? 0 : Math.max((count / maxCount) * 100, 15); // Min height of 15%
                
                return (
                  <div key={month} className="flex flex-col items-center" style={{ width: `${100 / Math.min(favoritesByMonth.length, 12)}%` }}>
                    <div 
                      className="w-full bg-blue-600 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${count} favorite${count !== 1 ? 's' : ''} in ${month}`}
                    ></div>
                    <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                      {month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Most favorited blog */}
      {mostFavorited && (
        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-medium mb-3">Most Popular Favorited Blog</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Link 
              href={`/blogs/${mostFavorited._id}`}
              className="text-lg font-medium text-blue-700 hover:underline"
            >
              {mostFavorited.title}
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              By {mostFavorited.author} • 
              {mostFavorited.likes?.length || 0} like{mostFavorited.likes?.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm mt-2 line-clamp-2">{mostFavorited.content}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesAnalytics;
