import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useFavorites } from '../../../lib/contexts/FavoritesContext';

interface FavoriteButtonProps {
  blogId: string;
  onToggleFavorite?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'default' | 'minimal' | 'outlined' | 'ghost' | 'pill';
  disabled?: boolean;
  showCount?: boolean;
  animation?: 'bounce' | 'pulse' | 'scale' | 'none';
  testId?: string;
  showTooltip?: boolean;
  customIcon?: React.ReactNode;
}

// Optimized icon component to reduce re-renders
const FavoriteIcon = React.memo(({ isFavorited, customIcon, size }: { 
  isFavorited: boolean; 
  customIcon?: React.ReactNode; 
  size: string;
}) => {
  if (customIcon) return <>{customIcon}</>;
  
  const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const iconSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.md;
  
  return (
    <svg 
      className={`${iconSize} transition-transform duration-200`}
      fill={isFavorited ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
      />
    </svg>
  );
});

FavoriteIcon.displayName = 'FavoriteIcon';

// Performance-optimized favorite button
const FavoriteButtonV3 = React.memo(({ 
  blogId, 
  onToggleFavorite, 
  size = 'md',
  showText = false,
  className = '',
  variant = 'default',
  disabled = false,
  showCount = false,
  animation = 'scale',
  testId,
  showTooltip = true,
  customIcon
}: FavoriteButtonProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { isFavorite, isLoading: contextLoading, toggleFavorite, favorites } = useFavorites();
  
  // Optimized state management
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized computations
  const isFavorited = useMemo(() => {
    if (!blogId || blogId === 'undefined' || blogId === '') return false;
    return optimisticState !== null ? optimisticState : isFavorite(blogId);
  }, [blogId, isFavorite, optimisticState]);

  const favoriteCount = useMemo(() => {
    if (!showCount) return 0;
    return favorites.filter(fav => fav.id === blogId).length;
  }, [showCount, favorites, blogId]);

  const isLoading = contextLoading || isProcessing;

  // Optimized click handler with debouncing
  const handleClick = useCallback(async () => {
    if (!session || disabled || isLoading || !blogId || blogId === 'undefined') {
      if (!session) {
        router.push('/auth/login');
      }
      return;
    }

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Optimistic update for instant feedback
    const newState = !isFavorited;
    setOptimisticState(newState);
    setIsProcessing(true);

    // Custom callback
    onToggleFavorite?.();

    // Debounced API call
    debounceRef.current = setTimeout(async () => {
      try {
        await toggleFavorite(blogId);
        // Success - optimistic state will be replaced by actual state
        setOptimisticState(null);
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticState(!newState);
        console.error('Failed to toggle favorite:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 300);
  }, [session, disabled, isLoading, blogId, isFavorited, onToggleFavorite, toggleFavorite, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Memoized style configurations
  const styles = useMemo(() => {
    const sizeConfig = {
      sm: { 
        button: 'px-2 py-1 text-sm gap-1', 
        text: 'text-xs',
        container: 'h-8 min-w-8'
      },
      md: { 
        button: 'px-3 py-2 text-base gap-2', 
        text: 'text-sm',
        container: 'h-10 min-w-10'
      },
      lg: { 
        button: 'px-4 py-3 text-lg gap-3', 
        text: 'text-base',
        container: 'h-12 min-w-12'
      }
    };

    const variantConfig = {
      default: {
        base: 'bg-white border border-gray-300 shadow-sm hover:shadow-md',
        favorited: 'text-red-600 border-red-300 bg-red-50',
        unfavorited: 'text-gray-500 hover:text-red-500 hover:border-red-300 hover:bg-red-50',
        loading: 'text-gray-400 bg-gray-50 cursor-not-allowed'
      },
      minimal: {
        base: 'bg-transparent border-none',
        favorited: 'text-red-600',
        unfavorited: 'text-gray-400 hover:text-red-500',
        loading: 'text-gray-300 cursor-not-allowed'
      },
      outlined: {
        base: 'bg-transparent border-2',
        favorited: 'text-red-600 border-red-600',
        unfavorited: 'text-gray-500 border-gray-300 hover:text-red-500 hover:border-red-500',
        loading: 'text-gray-300 border-gray-200 cursor-not-allowed'
      },
      ghost: {
        base: 'bg-transparent border-none hover:bg-gray-100',
        favorited: 'text-red-600 hover:bg-red-100',
        unfavorited: 'text-gray-400 hover:text-red-500 hover:bg-red-50',
        loading: 'text-gray-300 cursor-not-allowed'
      },
      pill: {
        base: 'rounded-full px-3 py-1',
        favorited: 'text-red-700 bg-red-200 hover:bg-red-300',
        unfavorited: 'text-gray-600 bg-gray-100 hover:bg-red-100 hover:text-red-600',
        loading: 'text-gray-400 bg-gray-100 cursor-not-allowed'
      }
    };

    const animationClasses = {
      bounce: 'animate-bounce-subtle',
      pulse: 'animate-pulse-subtle',
      scale: 'hover:scale-105 active:scale-95 transform-gpu',
      none: ''
    };

    return { sizeConfig, variantConfig, animationClasses };
  }, []);

  const { sizeConfig, variantConfig, animationClasses } = styles;
  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];
  const animationClass = animationClasses[animation];

  const buttonState = isLoading ? 'loading' : (isFavorited ? 'favorited' : 'unfavorited');

  // Memoized class names
  const buttonClasses = useMemo(() => [
    'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
    config.button,
    config.container,
    variantStyles.base,
    variantStyles[buttonState],
    animationClass,
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' '), [config, variantStyles, buttonState, animationClass, disabled, className]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={buttonClasses}
      title={showTooltip ? (isFavorited ? 'Remove from favorites' : 'Add to favorites') : undefined}
      data-testid={testId}
      data-blog-id={blogId}
      data-favorited={isFavorited}
      aria-label={`${isFavorited ? 'Remove from' : 'Add to'} favorites`}
      aria-pressed={isFavorited}
      type="button"
    >
      <FavoriteIcon 
        isFavorited={isFavorited} 
        customIcon={customIcon} 
        size={size}
      />
      
      {showText && (
        <span className={config.text}>
          {isFavorited ? 'Favorited' : 'Favorite'}
        </span>
      )}
      
      {showCount && favoriteCount > 0 && (
        <span className={`${config.text} bg-gray-200 px-1 rounded-full`}>
          {favoriteCount}
        </span>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
});

FavoriteButtonV3.displayName = 'FavoriteButtonV3';

export default FavoriteButtonV3;
