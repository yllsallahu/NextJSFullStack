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

  // Helper function to sanitize blog IDs
  const sanitizeBlogId = (id: string): string => {
    return id.replace(/^new ObjectId\("(.+)"\)$/, '$1');
  };

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
    const sanitizedId = sanitizeBlogId(blogId);
    return favoriteIds.includes(sanitizedId);
  };

  // Function to refresh favorites from the API
  const refreshFavorites = async (): Promise<void> => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/blogs/favorite');
      
      if (!res.ok) {
        let errorMessage = 'Failed to fetch favorites';
        
        switch (res.status) {
          case 401:
            errorMessage = 'You are not authorized to access favorites. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission to view favorites.';
            break;
          case 404:
            errorMessage = 'Favorites service not found.';
            break;
          case 500:
            errorMessage = 'Server error occurred while fetching favorites.';
            break;
          default:
            try {
              const errorData = await res.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              // If we can't parse error response, use default message
            }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      const blogsList = convertBlogDocumentsToBlog(data.favorites || []);
      
      // Ensure all blog IDs are properly sanitized
      const sanitizedBlogsList = blogsList.map(blog => ({
        ...blog,
        id: blog.id ? sanitizeBlogId(blog.id) : blog.id
      }));

      // Only update state if we have valid data
      if (Array.isArray(sanitizedBlogsList)) {
        setFavorites(sanitizedBlogsList);
        setFavoriteIds(sanitizedBlogsList
          .map(blog => blog.id)
          .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
        );
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      
      // Only reset favorites on authentication errors or when explicitly needed
      if (error instanceof Error && 
          (error.message.includes('authorized') || error.message.includes('forbidden'))) {
        setFavorites([]);
        setFavoriteIds([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle favorite status
  const toggleFavorite = async (blogId: string): Promise<void> => {
    if (!session || !blogId) {
      return;
    }

    const sanitizedId = sanitizeBlogId(blogId);
    const wasFavorited = isFavorite(sanitizedId);
    const originalFavorites = favorites;
    const originalIds = favoriteIds;

    // Optimistically update UI
    if (wasFavorited) {
      setFavoriteIds(prev => prev.filter(id => id !== sanitizedId));
      setFavorites(prev => prev.filter(blog => blog.id !== sanitizedId));
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/blogs/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blogId: sanitizedId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to toggle favorite';
        
        switch (response.status) {
          case 401:
            errorMessage = 'You are not authorized to modify favorites. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission to modify favorites.';
            break;
          case 404:
            errorMessage = 'Blog not found or favorites service unavailable.';
            break;
          case 500:
            errorMessage = 'Server error occurred while updating favorites.';
            break;
          default:
            try {
              const data = await response.json();
              errorMessage = data.error || errorMessage;
            } catch {
              // If we can't parse error response, use default message
            }
        }
        
        // Revert optimistic update on error
        setFavorites(originalFavorites);
        setFavoriteIds(originalIds);
        
        throw new Error(errorMessage);
      }

      // If we're adding (not removing) a favorite, refresh to get the full blog data
      if (!wasFavorited) {
        await refreshFavorites();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Revert optimistic update on error
      setFavorites(originalFavorites);
      setFavoriteIds(originalIds);
      
      if (error instanceof Error) {
        throw error; // Re-throw to let components handle the error
      }
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
