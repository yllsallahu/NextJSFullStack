import { useEffect, useState, useCallback, useMemo } from 'react';
import { Blog } from '../api/models/Blog';
import { useFavorites } from '../lib/contexts/FavoritesContext';
import { useSession } from 'next-auth/react';

interface UseUserFavoritesReturn {
  favorites: Blog[];
  favoriteCount: number;
  recentFavorites: Blog[];
  hasAnyFavorites: boolean;
  mostRecentFavorite: Blog | null;
  getFavoritesByAuthor: (authorId: string) => Blog[];
  getFavoritesByTag: (tag: string) => Blog[];
  addToFavorites: (blogId: string) => Promise<void>;
  removeFromFavorites: (blogId: string) => Promise<void>;
  toggleFavoriteStatus: (blogId: string) => Promise<void>;
  isFavorited: (blogId: string) => boolean;
  isLoading: boolean;
}

/**
 * A custom hook for advanced favorites management
 * @param limit The maximum number of recent favorites to return
 */
export function useUserFavorites(limit: number = 3): UseUserFavoritesReturn {
  const { data: session } = useSession();
  const { favorites, isLoading, toggleFavorite, isFavorite } = useFavorites();
  const [recentFavorites, setRecentFavorites] = useState<Blog[]>([]);

  // Update recent favorites whenever favorites list changes
  useEffect(() => {
    // Sort by createdAt date if available
    const sorted = [...favorites]
      .filter(blog => blog && blog.id && typeof blog.id === 'string')
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      })
      .slice(0, limit);
    
    setRecentFavorites(sorted);
  }, [favorites, limit]); // Only depend on favorites and limit

  // Get favorites by author with proper ID handling
  const getFavoritesByAuthor = useCallback(
    (authorId: string) => {
      return favorites.filter(blog => 
        blog && 
        typeof blog.author === 'string' && 
        blog.author === authorId
      );
    },
    [favorites]
  );

  // Get favorites by tag with validation
  const getFavoritesByTag = useCallback(
    (tag: string) => {
      return favorites.filter(blog => 
        blog && 
        Array.isArray(blog.tags) && 
        blog.tags.includes(tag)
      );
    },
    [favorites]
  );

  // Add to favorites with validation
  const addToFavorites = useCallback(
    async (blogId: string) => {
      if (!blogId || typeof blogId !== 'string') {
        console.error('Invalid blog ID:', blogId);
        return;
      }

      const sanitizedId = blogId.replace(/^new ObjectId\("(.+)"\)$/, '$1');
      if (isFavorite(sanitizedId)) return;
      
      try {
        await toggleFavorite(sanitizedId);
      } catch (error) {
        console.error('Error adding to favorites:', error);
      }
    },
    [isFavorite, toggleFavorite]
  );

  // Remove from favorites with validation
  const removeFromFavorites = useCallback(
    async (blogId: string) => {
      if (!blogId || typeof blogId !== 'string') {
        console.error('Invalid blog ID:', blogId);
        return;
      }

      const sanitizedId = blogId.replace(/^new ObjectId\("(.+)"\)$/, '$1');
      if (!isFavorite(sanitizedId)) return;
      
      try {
        await toggleFavorite(sanitizedId);
      } catch (error) {
        console.error('Error removing from favorites:', error);
      }
    },
    [isFavorite, toggleFavorite]
  );

  const validFavorites = useMemo(() => 
    favorites.filter(blog => blog && blog.id && typeof blog.id === 'string'),
  [favorites]);

  return {
    favorites: validFavorites,
    favoriteCount: validFavorites.length,
    recentFavorites,
    hasAnyFavorites: validFavorites.length > 0,
    mostRecentFavorite: recentFavorites[0] || null,
    getFavoritesByAuthor,
    getFavoritesByTag,
    addToFavorites,
    removeFromFavorites,
    toggleFavoriteStatus: toggleFavorite,
    isFavorited: isFavorite,
    isLoading
  };
}

// In the toggleFavorite function, handle the loading state gracefully
// const toggleFavorite = useCallback(async (blogId: string): Promise<void> => {
//     const authStatus = session?.user ? 'authenticated' : 'unauthenticated'; // Correct authStatus definition

//     if (!session) {
//       console.warn('Session is not available, skipping favorite toggle');
//       return; // Gracefully handle missing session
//     }

//     if (authStatus === 'unauthenticated') {
//       console.error('User is not authenticated');
//       return;
//     }

//     // ...existing logic...
//   }, [session]);
