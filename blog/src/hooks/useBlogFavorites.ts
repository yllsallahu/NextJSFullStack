import { useState, useCallback, useMemo } from 'react';
import { useUserFavorites } from './useUserFavorites';
import { useBlogActions } from './useBlogActions';
import { Blog } from '../api/models/Blog';

interface UseBlogFavoritesProps {
  onUpdate?: () => void;
  initialBlog?: Blog;
}

/**
 * A combined hook for blog and favorites functionality
 * Provides unified access to blog actions and favorites features
 */
export function useBlogFavorites({ onUpdate, initialBlog }: UseBlogFavoritesProps = {}) {
  // Load other hooks
  const userFavorites = useUserFavorites();
  const blogActions = useBlogActions({ onUpdate });
  
  // Local state
  const [activeBlog, setActiveBlog] = useState<Blog | null>(initialBlog || null);
  
  // Combined loading state
  const isLoading = userFavorites.isLoading || blogActions.isLoading;
  
  // Check if current active blog is a favorite
  const isActiveBlogFavorited = useMemo(() => {
    if (!activeBlog?._id) return false;
    return userFavorites.isFavorited(activeBlog._id);
  }, [activeBlog?._id, userFavorites.isFavorited]);
  
  // Set the active blog
  const setCurrentBlog = useCallback((blog: Blog | null) => {
    setActiveBlog(blog);
  }, []);
  
  // Toggle favorite status for active blog
  const toggleActiveBlogFavorite = useCallback(async () => {
    if (!activeBlog?._id) return;
    await userFavorites.toggleFavoriteStatus(activeBlog._id);
    if (onUpdate) onUpdate();
  }, [activeBlog?._id, userFavorites, onUpdate]);
  
  // Delete active blog with confirmation
  const deleteActiveBlog = useCallback(async () => {
    if (!activeBlog?._id) return;
    const result = await blogActions.handleDelete(activeBlog._id);
    return result;
  }, [activeBlog?._id, blogActions]);
  
  // Add comment to active blog
  const commentOnActiveBlog = useCallback(async (content: string) => {
    if (!activeBlog?._id || !content.trim()) return;
    const result = await blogActions.handleAddComment(activeBlog._id, content);
    return result;
  }, [activeBlog?._id, blogActions]);
  
  // Toggle like on active blog
  const toggleActiveBlogLike = useCallback(async () => {
    if (!activeBlog?._id) return;
    const result = await blogActions.handleLike(activeBlog._id);
    return result;
  }, [activeBlog?._id, blogActions]);
  
  // Get related favorites (by same author)
  const getRelatedFavorites = useCallback(() => {
    if (!activeBlog?.author) return [];
    return userFavorites.getFavoritesByAuthor(activeBlog.author);
  }, [activeBlog?.author, userFavorites]);
  
  return {
    // Basic blog and favorites data
    activeBlog,
    favorites: userFavorites.recentFavorites,
    allFavorites: userFavorites.favorites,
    favoriteCount: userFavorites.favoriteCount,
    
    // Status functions
    isLoading,
    isActiveBlogFavorited,
    hasAnyFavorites: userFavorites.hasAnyFavorites,
    
    // Actions for active blog
    setCurrentBlog,
    toggleActiveBlogFavorite,
    deleteActiveBlog,
    commentOnActiveBlog,
    toggleActiveBlogLike,
    
    // Favorites-specific functions
    getRelatedFavorites,
    getFavoritesByAuthor: userFavorites.getFavoritesByAuthor,
    getFavoritesByTag: userFavorites.getFavoritesByTag
  };
}
