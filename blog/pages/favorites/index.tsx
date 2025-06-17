import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import MainLayout from '../../src/components/MainLayout';
import { Blog } from '../../src/api/models/Blog';
import { convertBlogDocumentsToBlog } from '../../src/lib/adapters';
import { FavoritesProvider, useFavorites } from '../../src/lib/contexts/FavoritesContext';

interface FavoritesPageProps {
  initialFavorites: Blog[];
  initialFavoriteIds: string[];
}

const FavoritesContent = React.memo(() => {
  const { favorites, isLoading, refreshFavorites } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFavorites();
    } finally {
      setRefreshing(false);
    }
  }, [refreshFavorites]);

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">My Favorites</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              refreshing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {refreshing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            ) : (
              'Refresh'
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
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
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-500 mb-4">Start exploring blogs and add some to your favorites!</p>
            <a
              href="/blogs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
            >
              Browse Blogs
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((blog) => (
              <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {blog.imageUrl && (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={blog.imageUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {blog.summary || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'General'}
                    </span>
                    <a
                      href={`/blogs/${blog.id}`}
                      className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors duration-200"
                    >
                      Read More →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
});

FavoritesContent.displayName = 'FavoritesContent';

export default function FavoritesPage({ initialFavorites, initialFavoriteIds }: FavoritesPageProps) {
  return (
    <>
      <Head>
        <title>My Favorites - Blog</title>
        <meta name="description" content="View and manage your favorite blogs" />
      </Head>
      
      <FavoritesProvider 
        initialFavorites={initialFavorites}
        initialFavoriteIds={initialFavoriteIds}
      >
        <FavoritesContent />
      </FavoritesProvider>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Unified build-time detection logic
  const isBuildTime = typeof window === 'undefined' && (
    // During Vercel build process (using VERCEL_URL availability as indicator)
    process.env.VERCEL === '1' && !process.env.VERCEL_URL ||
    // During CI builds
    process.env.CI === 'true' ||
    // During npm run build without database
    (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) ||
    // Explicit build flag
    process.env.NEXT_PHASE === 'phase-production-build'
  );

  if (isBuildTime) {
    return {
      props: {
        initialFavorites: [],
        initialFavoriteIds: []
      },
    };
  }

  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/favorites',
        permanent: false
      }
    };
  }

  try {
    // Fetch favorites data
    const baseUrl = process.env.NEXTAUTH_URL || `https://${context.req.headers.host}`;
    const res = await fetch(`${baseUrl}/api/blogs/favorite`, {
      headers: {
        cookie: context.req.headers.cookie || ''
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch favorites, status:', res.status);
      return {
        props: {
          initialFavorites: [],
          initialFavoriteIds: []
        }
      };
    }
    
    const data = await res.json();
    const blogDocuments = data.favorites || [];
    
    // Convert BlogDocument[] to Blog[]
    const favorites = convertBlogDocumentsToBlog(blogDocuments);
    const favoriteIds = favorites.map(blog => blog.id || '');

    return {
      props: {
        initialFavorites: favorites,
        initialFavoriteIds: favoriteIds
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialFavorites: [],
        initialFavoriteIds: []
      }
    };
  }
}
