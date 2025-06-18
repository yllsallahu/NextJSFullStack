import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Blog } from '../../api/models/Blog';

// Custom comment interfaces to avoid conflicts with DOM types
interface BlogComment {
  _id: string;
  content: string;
  author: string;
  createdAt: Date;
}

interface RawCommentData {
  _id?: string;
  content?: string;
  author?: string;
  createdAt?: string | Date;
}

interface RawFavoriteData {
  id?: string;
  title?: string;
  content?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  imageUrl?: string;
  summary?: string;
  isPublished?: boolean;
  slug?: string;
  views?: number;
  likes?: string[];
  comments?: RawCommentData[];
}

// Extend Blog interface to use our custom BlogComment type
interface BlogWithComments extends Omit<Blog, 'comments'> {
  comments: BlogComment[];
}

interface FavoriteResponseData {
  favorites: RawFavoriteData[];
}

interface ProcessedBlog extends BlogWithComments {
  id: string;
}

interface FavoritesContextType {
  favorites: Blog[];
  favoriteIds: string[];
  isLoading: boolean;
  isFavorite: (blogId: string) => boolean;
  toggleFavorite: (blogId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

// Create a context with default values
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  
  return context;
};

export function FavoritesProvider({ children, initialFavorites = [], initialFavoriteIds = [] }: { 
  children: React.ReactNode;
  initialFavorites?: Blog[];
  initialFavoriteIds?: string[];
}) {
  const { data: session, status: authStatus } = useSession();
  const [favorites, setFavorites] = useState<BlogWithComments[]>(initialFavorites);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);

  // Helper to sanitize blog IDs
  const sanitizeBlogId = useCallback((id: string): string => {
    return id.replace(/^new ObjectId\("(.+)"\)$/, '$1').trim();
  }, []);

  // Helper to process a raw comment into a valid BlogComment object
  const processComment = useCallback((raw: unknown): BlogComment => {
    if (typeof raw !== 'object' || !raw) {
      return {
        _id: '',
        content: '',
        author: '',
        createdAt: new Date()
      };
    }

    const comment = raw as RawCommentData;
    return {
      _id: comment._id || '',
      content: comment.content || '',
      author: comment.author || '',
      createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date()
    };
  }, []);

  // Process raw blog data into a valid Blog object
  const processBlogData = useCallback((raw: RawFavoriteData): ProcessedBlog => ({
    id: raw.id ? sanitizeBlogId(raw.id) : '',
    title: raw.title || '',
    content: raw.content || '',
    author: raw.author || '',
    createdAt: raw.createdAt || new Date(),
    updatedAt: raw.updatedAt || new Date(),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    imageUrl: raw.imageUrl,
    summary: raw.summary,
    isPublished: !!raw.isPublished,
    slug: raw.slug || '',
    views: typeof raw.views === 'number' ? raw.views : 0,
    likes: Array.isArray(raw.likes) ? raw.likes.filter((id): id is string => typeof id === 'string') : [],
    comments: Array.isArray(raw.comments) ? raw.comments.map(processComment) : []
  }), [sanitizeBlogId, processComment]);

  // Check if a blog is favorited
  const isFavorite = useCallback((blogId: string): boolean => {
    if (authStatus !== 'authenticated') return false;
    const sanitizedId = sanitizeBlogId(blogId);
    return favoriteIds.includes(sanitizedId);
  }, [favoriteIds, sanitizeBlogId, authStatus]);

  // Refresh favorites list - FIXED to prevent infinite loops
  const refreshFavorites = useCallback(async () => {
    // Skip if not authenticated
    if (authStatus !== 'authenticated') {
      setFavorites([]);
      setFavoriteIds([]);
      setHasInitiallyFetched(true);
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/blogs/favorite');

      if (!res.ok) {
        console.warn('Failed to fetch favorites:', res.status);
        setFavorites([]);
        setFavoriteIds([]);
        return;
      }

      const data = await res.json() as FavoriteResponseData;

      if (!data || !Array.isArray(data.favorites)) {
        setFavorites([]);
        setFavoriteIds([]);
        return;
      }

      // Process and validate the data
      const validBlogs = data.favorites
        .filter((blog): blog is RawFavoriteData => 
          blog && typeof blog === 'object' && typeof blog.id === 'string')
        .map(processBlogData)
        .filter((blog): blog is Blog => blog.id !== '');

      setFavorites(validBlogs);
      setFavoriteIds(validBlogs.map(blog => blog.id));
      setHasInitiallyFetched(true);

    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
      setFavoriteIds([]);
      setHasInitiallyFetched(true);
    } finally {
      setIsLoading(false);
    }
  }, [authStatus, isLoading, processBlogData]);

  // Toggle favorite status with optimistic updates
  const toggleFavorite = useCallback(async (blogId: string): Promise<void> => {
    if (authStatus !== 'authenticated') {
      console.warn('User not authenticated');
      return;
    }

    const sanitizedId = sanitizeBlogId(blogId);
    if (!sanitizedId) {
      throw new Error('Invalid blog ID');
    }

    // Optimistic update
    const currentIsFavorite = favoriteIds.includes(sanitizedId);
    if (currentIsFavorite) {
      setFavoriteIds(prev => prev.filter(id => id !== sanitizedId));
      setFavorites(prev => prev.filter(blog => blog.id !== sanitizedId));
    } else {
      setFavoriteIds(prev => [...prev, sanitizedId]);
    }

    try {
      const res = await fetch('/api/blogs/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId: sanitizedId })
      });

      if (!res.ok) {
        // Revert optimistic update on error
        if (currentIsFavorite) {
          setFavoriteIds(prev => [...prev, sanitizedId]);
        } else {
          setFavoriteIds(prev => prev.filter(id => id !== sanitizedId));
          setFavorites(prev => prev.filter(blog => blog.id !== sanitizedId));
        }
        throw new Error('Failed to toggle favorite');
      }

      // If we added a favorite, we might want to refresh to get the full blog data
      if (!currentIsFavorite) {
        // Don't call refreshFavorites here to avoid loops, just keep the optimistic update
      }

    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      if (currentIsFavorite) {
        setFavoriteIds(prev => [...prev, sanitizedId]);
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== sanitizedId));
        setFavorites(prev => prev.filter(blog => blog.id !== sanitizedId));
      }
      throw error;
    }
  }, [authStatus, sanitizeBlogId, favoriteIds]);

  // ONE TIME ONLY initial fetch when authentication is ready
  useEffect(() => {
    // Only fetch once when auth status changes to authenticated and we haven't fetched yet
    if (authStatus === 'authenticated' && !hasInitiallyFetched && !isLoading) {
      refreshFavorites();
    } else if (authStatus === 'unauthenticated') {
      setFavorites([]);
      setFavoriteIds([]);
      setHasInitiallyFetched(true);
    }
  }, [authStatus, hasInitiallyFetched, isLoading]); // REMOVED refreshFavorites from deps

  const value = {
    favorites,
    favoriteIds,
    isLoading,
    isFavorite,
    toggleFavorite,
    refreshFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
