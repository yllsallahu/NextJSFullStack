import { useEffect, useState, useCallback } from 'react';
import { Blog } from '../api/models/Blog';
import { useFavorites } from '../lib/contexts/FavoritesContext';
import { useSession } from 'next-auth/react';

interface UseUserFavoritesReturn {
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
  const { favorites, isLoading, toggleFavorite, isFavorite, refreshFavorites } = useFavorites();
  const [recentFavorites, setRecentFavorites] = useState<Blog[]>([]);

  // Update recent favorites whenever favorites list changes
  useEffect(() => {
    // Sort by added time (if we had it) or just take the first few
    const recent = [...favorites].slice(0, limit);
    setRecentFavorites(recent);
  }, [favorites, limit]);

  // Get favorites by author
  const getFavoritesByAuthor = useCallback(
    (authorId: string) => {
      return favorites.filter(blog => blog.author === authorId);
    },
    [favorites]
  );

  // Get favorites by tag (assuming we add a tags property to blogs)
  const getFavoritesByTag = useCallback(
    (tag: string) => {
      return favorites.filter(blog => blog.tags?.includes(tag));
    },
    [favorites]
  );

  // Add to favorites
  const addToFavorites = useCallback(
    async (blogId: string) => {
      if (isFavorite(blogId)) return;
      await toggleFavorite(blogId);
    },
    [isFavorite, toggleFavorite]
  );

  // Remove from favorites
  const removeFromFavorites = useCallback(
    async (blogId: string) => {
      if (!isFavorite(blogId)) return;
      await toggleFavorite(blogId);
    },
    [isFavorite, toggleFavorite]
  );

  return {
    favoriteCount: favorites.length,
    recentFavorites,
    hasAnyFavorites: favorites.length > 0,
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
