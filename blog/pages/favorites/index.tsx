import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import MainLayout from '../../src/components/MainLayout';
import BlogCard from '../../src/components/shared/BlogCard';
import { BlogDocument } from '../../src/api/services/Blog';
import { Blog } from '../../src/api/models/Blog';
import { convertBlogDocumentsToBlog } from '../../src/lib/adapters';

interface FavoritesPageProps {
  initialFavorites: Blog[];
  favoriteBlogIds: string[];
}

export default function FavoritesPage({ initialFavorites, favoriteBlogIds }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<Blog[]>(initialFavorites);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(favoriteBlogIds);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/blogs/favorite');
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      
      // Convert BlogDocument[] to Blog[]
      const blogsList = convertBlogDocumentsToBlog(data.favorites);
      setFavorites(blogsList);
      setFavoriteIds(blogsList.map(blog => blog._id || ''));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    fetchFavorites();
  };

  const handleDelete = async (blogId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const res = await fetch(`/api/blogs/${blogId}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete blog');
      }

      // Remove the deleted blog from favorites
      setFavorites(prev => prev.filter(blog => blog._id !== blogId));
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

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
                key={blog._id?.toString()} 
                blog={blog} 
                onDelete={handleDelete}
                onEdit={id => window.location.href = `/blogs/edit/${id}`}
                onUpdate={handleUpdate}
                favorites={favoriteIds}
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

export const getServerSideProps: GetServerSideProps = async (context) => {
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
          favoriteBlogIds: []
        }
      };
    }
    
    const data = await res.json();
    const blogDocuments = data.favorites || [];
    
    // Convert BlogDocument[] to Blog[]
    const favorites = convertBlogDocumentsToBlog(blogDocuments);
    const favoriteBlogIds = favorites.map(blog => blog._id || '');

    return {
      props: {
        initialFavorites: favorites,
        favoriteBlogIds
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialFavorites: [],
        favoriteBlogIds: []
      }
    };
  }
}
