import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useEffect } from 'react';
import MainLayout from '../../src/components/MainLayout';
import BlogCard from '../../src/components/shared/BlogCard';
import { Blog } from '../../src/api/models/Blog';
import { convertBlogDocumentsToBlog } from '../../src/lib/adapters';
import { useFavorites } from '../../src/lib/contexts/FavoritesContext';
import { FavoritesProvider } from '../../src/lib/contexts/FavoritesContext';

interface FavoritesPageProps {
  initialFavorites: Blog[];
  initialFavoriteIds: string[];
}

function FavoritesContent() {
  const { favorites, isLoading, refreshFavorites } = useFavorites();

  // Fetch favorites on component mount
  useEffect(() => {
    refreshFavorites();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">My Favorite Blogs</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(blog => (
              <BlogCard 
                key={blog.id} 
                blog={blog} 
                onUpdate={refreshFavorites}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-black mb-3">No Favorite Blogs Yet</h2>
            <p className="text-gray-600">
              Browse blogs and click the star icon to add them to your favorites.
            </p>
            <a 
              href="/blogs" 
              className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Blogs
            </a>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function FavoritesPage({ initialFavorites, initialFavoriteIds }: FavoritesPageProps) {
  return (
    <FavoritesProvider 
      initialFavorites={initialFavorites}
      initialFavoriteIds={initialFavoriteIds}
    >
      <FavoritesContent />
    </FavoritesProvider>
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
    // Use absolute URL with base URL
    const baseUrl = process.env.NEXTAUTH_URL || `https://${context.req.headers.host}`;
    const res = await fetch(`${baseUrl}/api/blogs/favorite`, {
      headers: {
        cookie: context.req.headers.cookie || ''
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch favorites, status:', res.status);
      // Return empty data rather than throwing an error
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
