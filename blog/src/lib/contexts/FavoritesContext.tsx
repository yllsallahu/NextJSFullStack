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

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const [favorites, setFavorites] = useState<BlogWithComments[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

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

  // Refresh favorites list with better error handling
  const refreshFavorites = useCallback(async () => {
    // Skip fetch if auth status is loading or unauthenticated
    if (authStatus === 'loading' || authStatus === 'unauthenticated') {
      setFavorites([]);
      setFavoriteIds([]);
      return;
    }

    // Don't refetch if already loading
    if (isLoading) return;

    setIsLoading(true);
    setLastError(null);

    try {
      const res = await fetch('/api/blogs/favorite');

      // Handle specific error cases without throwing
      if (res.status === 401 || res.status === 403) {
        console.warn('Unauthorized access to favorites API');
        setFavorites([]);
        setFavoriteIds([]);
        setIsLoading(false); // Ensure loading state is reset
        return;
      }

      if (!res.ok) {
        let errorMessage = 'Failed to fetch favorites';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse error response, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await res.json() as FavoriteResponseData;

      // Handle empty or invalid response gracefully
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

    } catch (error) {
      console.error('Error fetching favorites:', error);
      setLastError(error instanceof Error ? error : new Error('Unknown error'));

      // Don't reset favorites on network errors to prevent UI flashing
      if (error instanceof Error && 
          (error.message.includes('unauthorized') || 
           error.message.includes('forbidden'))) {
        setFavorites([]);
        setFavoriteIds([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle favorite status with better error handling
  const toggleFavorite = useCallback(async (blogId: string): Promise<void> => {
    if (authStatus === 'loading') {
      throw new Error('Authentication state is loading');
    }

    if (authStatus === 'unauthenticated') {
      // Instead of throwing, we'll let the component handle the redirect
      return;
    }

    const sanitizedId = sanitizeBlogId(blogId);
    if (!sanitizedId) {
      throw new Error('Invalid blog ID');
    }

    try {
      const res = await fetch('/api/blogs/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId: sanitizedId })
      });

      if (res.status === 401 || res.status === 403) {
        setFavorites([]);
        setFavoriteIds([]);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to toggle favorite status');
      }

      // Only refresh if the toggle was successful
      await refreshFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setLastError(error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }, []);

  // Initial fetch and auth state changes
  useEffect(() => {
    // Skip initial fetch while auth is loading
    if (authStatus === 'loading') return;
    
    if (authStatus === 'authenticated') {
      refreshFavorites();
    } else {
      // Clear favorites when explicitly not authenticated
      setFavorites([]);
      setFavoriteIds([]);
    }
  }, []);

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
