import { useState, useEffect } from 'react';
import { useFavorites } from '@/lib/contexts/FavoritesContext';
import { Blog } from '@/api/models/Blog';

interface FavoriteStats {
  count: number;
  addedToday: number;
  removedToday: number;
  commonTags: Array<{ tag: string; count: number }>;
  favoriteAuthors: Array<{ author: string; count: number }>;
  favoritesByMonth: Array<{ month: string; count: number }>;
  mostFavorited?: Blog | null;
  recentlyRemoved: string[];
}

/**
 * A custom hook for tracking and analyzing favorites statistics over time
 */
export function useFavoriteStats(): FavoriteStats & { isLoading: boolean } {
  const { favorites, isLoading } = useFavorites();
  const [stats, setStats] = useState<FavoriteStats>({
    count: 0,
    addedToday: 0,
    removedToday: 0,
    commonTags: [],
    favoriteAuthors: [],
    favoritesByMonth: [],
    mostFavorited: null,
    recentlyRemoved: []
  });
  
  // Track removed favorites
  const [previousFavorites, setPreviousFavorites] = useState<string[]>([]);
  
  // Update statistics whenever favorites change
  useEffect(() => {
    if (isLoading) return;
    
    // Deep analysis of favorites
    const analyze = () => {
      // Track recently removed favorites
      const currentFavoriteIds = favorites.map(blog => blog._id || '').filter(Boolean);
      const removed = previousFavorites.filter(id => !currentFavoriteIds.includes(id));
      
      // Count favorites added today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const addedToday = favorites.filter(blog => {
        const createdAt = blog.createdAt ? new Date(blog.createdAt) : null;
        return createdAt && createdAt >= today;
      }).length;
      
      // Analyze tags
      const tagCounts: Record<string, number> = {};
      favorites.forEach(blog => {
        if (blog.tags) {
          blog.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      const commonTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Analyze authors
      const authorCounts: Record<string, number> = {};
      favorites.forEach(blog => {
        if (blog.author) {
          authorCounts[blog.author] = (authorCounts[blog.author] || 0) + 1;
        }
      });
      
      const favoriteAuthors = Object.entries(authorCounts)
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // Analyze by month
      const months: Record<string, number> = {};
      favorites.forEach(blog => {
        if (blog.createdAt) {
          const date = new Date(blog.createdAt);
          const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          months[monthYear] = (months[monthYear] || 0) + 1;
        }
      });
      
      const favoritesByMonth = Object.entries(months)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          // Sort by date (assuming format "MMM YYYY")
          const [monthA, yearA] = a.month.split(' ');
          const [monthB, yearB] = b.month.split(' ');
          
          if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
          
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthNames.indexOf(monthB) - monthNames.indexOf(monthA);
        });
      
      // Find most favorited blog (could be based on likes or other metrics)
      const mostFavorited = [...favorites].sort((a, b) => 
        (b.likes?.length || 0) - (a.likes?.length || 0)
      )[0] || null;
      
      setStats({
        count: favorites.length,
        addedToday,
        removedToday: removed.length,
        commonTags,
        favoriteAuthors,
        favoritesByMonth,
        mostFavorited,
        recentlyRemoved: removed
      });
      
      // Update previous favorites for next comparison
      setPreviousFavorites(currentFavoriteIds);
    };
    
    analyze();
  }, [favorites, isLoading, previousFavorites]);
  
  return {
    ...stats,
    isLoading
  };
}
