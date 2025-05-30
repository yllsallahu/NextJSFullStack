import { useState } from 'react';
import { Blog } from '../api/models/Blog';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useUserFavorites } from './useUserFavorites';

interface UseBlogActionsProps {
  onUpdate?: () => void;
}

export const useBlogActions = ({ onUpdate }: UseBlogActionsProps = {}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { toggleFavoriteStatus: toggleFavorite, isFavorited: isFavorite, isLoading: favoritesLoading } = useUserFavorites();

  // Handle like toggling
  const handleLike = async (blogId: string) => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${router.asPath}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/blogs/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId })
      });

      if (!res.ok) throw new Error('Failed to like blog');

      if (onUpdate) onUpdate();
      return await res.json();
    } catch (error) {
      console.error('Error liking blog:', error);
      return { error: true };
    } finally {
      setIsLoading(false);
    }
  };  // Handle blog deletion
  const handleDelete = async (blogId: string) => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${router.asPath}`);
      return;
    }

    if (!window.confirm('A jeni të sigurt që dëshironi ta fshini këtë blog?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/blogs/${blogId}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete blog');
      }

      if (onUpdate) onUpdate();
      
      // If we're on a specific blog page, redirect to the blogs list
      if (router.pathname.includes('/blogs/[id]')) {
        router.push('/blogs');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting blog:', error);
      return { error: true };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle comment adding
  const handleAddComment = async (blogId: string, content: string) => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${router.asPath}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/blogs/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, content })
      });

      if (!res.ok) {
        throw new Error('Failed to add comment');
      }

      if (onUpdate) onUpdate();
      return await res.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      return { error: true };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (blogId: string, commentId: string) => {
    if (!session?.user?.isSuperUser) return;
    
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/blogs/comments/${blogId}/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      if (onUpdate) onUpdate();
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { error: true };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle favorite toggling, using the useFavorites hook
  const handleToggleFavorite = async (blogId: string) => {
    await toggleFavorite(blogId);
    if (onUpdate) onUpdate();
  };

  return {
    isLoading,
    handleLike,
    handleDelete,
    handleAddComment,
    handleDeleteComment,
    handleToggleFavorite,
    isFavorite
  };
};
