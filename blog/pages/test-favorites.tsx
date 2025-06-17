import { useSession } from 'next-auth/react';
import { useFavorites } from '../src/lib/contexts/FavoritesContext';
import { useEffect } from 'react';
import MainLayout from '../src/components/MainLayout';

export default function TestFavorites() {
  const { data: session } = useSession();
  const { favorites, isLoading, toggleFavorite, isFavorite, refreshFavorites } = useFavorites();

  useEffect(() => {
    if (session) {
      refreshFavorites();
    }
  }, [session, refreshFavorites]);

  const handleToggleFavorite = async (blogId: string) => {
    try {
      await toggleFavorite(blogId);
      console.log('Favorite toggled successfully');
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (!session) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-4">Test Favorites</h1>
          <p>Please login to test favorites functionality.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Test Favorites</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Favorites Status</h2>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Favorites count: {favorites.length}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Buttons</h2>
          <button 
            onClick={() => handleToggleFavorite('test-blog-1')}
            className={`mr-2 px-4 py-2 rounded ${
              isFavorite('test-blog-1') 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-300 text-black'
            }`}
            disabled={isLoading}
          >
            {isFavorite('test-blog-1') ? 'Remove from Favorites' : 'Add to Favorites'} (Test Blog 1)
          </button>
          
          <button 
            onClick={() => handleToggleFavorite('test-blog-2')}
            className={`px-4 py-2 rounded ${
              isFavorite('test-blog-2') 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-300 text-black'
            }`}
            disabled={isLoading}
          >
            {isFavorite('test-blog-2') ? 'Remove from Favorites' : 'Add to Favorites'} (Test Blog 2)
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Current Favorites</h2>
          {favorites.length > 0 ? (
            <ul className="list-disc list-inside">
              {favorites.map((blog) => (
                <li key={blog.id} className="mb-1">
                  {blog.title} (ID: {blog.id})
                </li>
              ))}
            </ul>
          ) : (
            <p>No favorites yet.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
