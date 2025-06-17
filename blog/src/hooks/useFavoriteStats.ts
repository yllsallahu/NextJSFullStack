import { useState, useEffect, useMemo, useCallback } from 'react';
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

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  // Get today's date at midnight in the user's timezone
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Create a set of IDs for faster lookup
  const previousFavoritesSet = useMemo(() => new Set<string>(), []);

  // Memoize the current favorite IDs to avoid unnecessary recalculations
  const currentFavoriteIds = useMemo(() => {
    if (isLoading) return [];
    return Array.from(new Set(
      favorites
        .map(blog => blog.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ));
  }, [favorites, isLoading]);

  // Memoize expensive tag counting logic
  const calculateTagCounts = useCallback((blogs: Blog[]) => {
    const counts: Record<string, number> = {};
    blogs.forEach(blog => {
      if (Array.isArray(blog.tags)) {
        blog.tags.forEach(tag => {
          if (typeof tag === 'string' && tag.trim()) {
            counts[tag] = (counts[tag] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, []);

  // Memoize expensive author counting logic
  const calculateAuthorCounts = useCallback((blogs: Blog[]) => {
    const counts: Record<string, number> = {};
    blogs.forEach(blog => {
      if (typeof blog.author === 'string' && blog.author.trim()) {
        counts[blog.author] = (counts[blog.author] || 0) + 1;
      }
    });
    return counts;
  }, []);

  // Calculate favorites by month with proper date handling
  const calculateFavoritesByMonth = useCallback((blogs: Blog[]) => {
    const months: Record<string, number> = {};
    const processedDates = new Set<string>();

    blogs.forEach(blog => {
      if (!blog.createdAt) return;

      try {
        const date = new Date(blog.createdAt);
        if (isNaN(date.getTime())) return;

        const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        // Avoid duplicate counts
        const dateKey = `${blog.id}-${monthYear}`;
        if (processedDates.has(dateKey)) return;
        
        processedDates.add(dateKey);
        months[monthYear] = (months[monthYear] || 0) + 1;
      } catch (e) {
        console.error('Invalid date format for blog:', blog.id, e);
      }
    });

    return Object.entries(months)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');
        
        if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
        return monthNames.indexOf(monthB) - monthNames.indexOf(monthA);
      });
  }, []);

  // Find the most favorited blog with proper validation
  const findMostFavoritedBlog = useCallback((blogs: Blog[]) => {
    if (blogs.length === 0) return null;

    return blogs.reduce((most, current) => {
      const currentLikes = Array.isArray(current.likes) ? current.likes.length : 0;
      const mostLikes = most ? (Array.isArray(most.likes) ? most.likes.length : 0) : -1;
      
      return currentLikes > mostLikes ? current : most;
    }, null as Blog | null);
  }, []);

  // Track removed favorites using Sets for better performance
  const findRemovedFavorites = useCallback((current: string[], previousSet: Set<string>) => {
    const currentSet = new Set(current);
    return Array.from(previousSet).filter(id => !currentSet.has(id));
  }, []);

  // Count blogs added today with proper date validation
  const countAddedToday = useCallback((blogs: Blog[], todayDate: Date) => {
    return blogs.filter(blog => {
      if (!blog.createdAt) return false;
      try {
        const createdAt = new Date(blog.createdAt);
        return !isNaN(createdAt.getTime()) && createdAt >= todayDate;
      } catch (e) {
        console.error('Invalid date format for blog:', blog.id, e);
        return false;
      }
    }).length;
  }, []);

  // Update statistics whenever favorites change
  useEffect(() => {
    if (isLoading) return;

    try {
      // Find removed favorites
      const removed = findRemovedFavorites(currentFavoriteIds, previousFavoritesSet);
      
      // Update previous favorites set for next comparison
      previousFavoritesSet.clear();
      currentFavoriteIds.forEach(id => previousFavoritesSet.add(id));

      // Calculate all stats
      const addedToday = countAddedToday(favorites, today);
      const tagCounts = calculateTagCounts(favorites);
      const commonTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const authorCounts = calculateAuthorCounts(favorites);
      const favoriteAuthors = Object.entries(authorCounts)
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const favoritesByMonth = calculateFavoritesByMonth(favorites);
      const mostFavorited = findMostFavoritedBlog(favorites);

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
    } catch (error) {
      console.error('Error calculating favorite stats:', error);
      // Keep the previous stats in case of error
    }
  }, [
    favorites,
    isLoading,
    today,
    currentFavoriteIds,
    previousFavoritesSet,
    calculateTagCounts,
    calculateAuthorCounts,
    calculateFavoritesByMonth,
    findMostFavoritedBlog,
    findRemovedFavorites,
    countAddedToday
  ]);

  return {
    ...stats,
    isLoading
  };
}
