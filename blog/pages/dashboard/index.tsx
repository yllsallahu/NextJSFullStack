import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useEffect } from 'react';
import Head from 'next/head';
import MainLayout from '../../src/components/MainLayout';
import FavoritesStats from '../../src/components/shared/FavoritesStats';
import FavoritesAnalytics from '../../src/components/shared/FavoritesAnalytics';
import FavoritesOverview from '../../src/components/shared/FavoritesOverview';
import { Blog } from '../../src/api/models/Blog';
import { convertBlogDocumentsToBlog } from '../../src/lib/adapters';

interface DashboardPageProps {
  initialFavorites: Blog[];
  initialFavoriteIds: string[];
}

export default function DashboardPage({ initialFavorites, initialFavoriteIds }: DashboardPageProps) {
  return (
    <>
      <Head>
        <title>Dashboard - My Favorites</title>
        <meta name="description" content="View and manage your favorite blogs" />
      </Head>
      
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-black mb-8">My Dashboard</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area - 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview of favorites with filtering */}
              <FavoritesOverview />
              
              {/* Detailed analytics */}
              <FavoritesAnalytics />
            </div>
            
            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Quick stats */}
              <FavoritesStats />
              
              {/* Call to action card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-6 text-white shadow-md">
                <h3 className="text-xl font-bold mb-3">Discover More Blogs</h3>
                <p className="mb-4 opacity-90">
                  Find new interesting content and expand your collection of favorite blogs.
                </p>
                <a 
                  href="/blogs" 
                  className="inline-block px-4 py-2 bg-white text-blue-700 rounded font-medium hover:bg-blue-50 transition-colors"
                >
                  Browse Blogs
                </a>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
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
        destination: '/auth/signin?callbackUrl=/dashboard',
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
