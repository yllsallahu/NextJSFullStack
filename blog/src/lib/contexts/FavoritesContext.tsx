import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Blog } from '../../api/models/Blog';
import { convertBlogDocumentsToBlog } from '../adapters';

interface FavoritesContextType {
  favorites: Blog[];
  favoriteIds: string[];
  isLoading: boolean;
  toggleFavorite: (blogId: string) => Promise<void>;
  isFavorite: (blogId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

// Create a context with default values
const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  favoriteIds: [],
  isLoading: false,
  toggleFavorite: async () => {},
  isFavorite: () => false,
  refreshFavorites: async () => {},
});

interface FavoritesProviderProps {
  children: ReactNode;
  initialFavorites?: Blog[];
  initialFavoriteIds?: string[];
}

export const FavoritesProvider = ({ 
  children, 
  initialFavorites = [], 
  initialFavoriteIds = [] 
}: FavoritesProviderProps) => {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Blog[]>(initialFavorites);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Refresh favorites when session changes
  useEffect(() => {
    if (session) {
      refreshFavorites();
    } else {
      // Clear favorites when logged out
      setFavorites([]);
      setFavoriteIds([]);
    }
  }, [session]);

  // Function to check if a blog is favorited
  const isFavorite = (blogId: string): boolean => {
    return favoriteIds.includes(blogId);
  };

  // Function to refresh favorites from the API
  const refreshFavorites = async (): Promise<void> => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/blogs/favorite');
      
      if (!res.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data = await res.json();
      const blogsList = convertBlogDocumentsToBlog(data.favorites || []);
      
      setFavorites(blogsList);
      setFavoriteIds(blogsList.map(blog => blog._id || ''));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle favorite status
  const toggleFavorite = async (blogId: string): Promise<void> => {
    if (!session) {
      // Handle unauthenticated users (redirect to login in the component)
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/blogs/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blogId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle favorite');
      }

      // Update local state optimistically
      if (isFavorite(blogId)) {
        setFavoriteIds(prevIds => prevIds.filter(id => id !== blogId));
        setFavorites(prevFavorites => prevFavorites.filter(blog => blog._id !== blogId));
      } else {
        // If adding to favorites, we'll refresh the whole list to get the full blog data
        await refreshFavorites();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      await refreshFavorites();
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    favorites,
    favoriteIds,
    isLoading,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Custom hook for using the favorites context
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  
  return context;
};
