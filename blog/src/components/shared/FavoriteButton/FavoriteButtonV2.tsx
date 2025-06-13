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
  testId?: string; // For testing
  showTooltip?: boolean;
  customIcon?: React.ReactNode;
}

// Performance optimizations
const FavoriteButtonV2 = React.memo(({ 
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
  
  // Local state with optimistic updates
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

  // Memoize favorite status with optimistic updates
  const isFavorited = useMemo(() => {
    if (!blogId || blogId === 'undefined' || blogId === '') return false;
    return optimisticState !== null ? optimisticState : isFavorite(blogId);
  }, [blogId, isFavorite, optimisticState]);

  // Get favorite count for this blog (if needed)
  const favoriteCount = useMemo(() => {
    if (!showCount) return 0;
    // In a real implementation, you'd get this from the blog data or a separate API
    return Math.floor(Math.random() * 50); // Mock data for demo
  }, [showCount, blogId]);

  // Enhanced size configurations
  const sizeConfig = {
    sm: { 
      icon: 'w-3.5 h-3.5', 
      button: 'p-1.5 min-w-[28px] h-7', 
      text: 'text-xs font-medium',
      gap: 'gap-1'
    },
    md: { 
      icon: 'w-4 h-4', 
      button: 'p-2 min-w-[32px] h-8', 
      text: 'text-sm font-medium',
      gap: 'gap-1.5'
    },
    lg: { 
      icon: 'w-5 h-5', 
      button: 'p-2.5 min-w-[36px] h-9', 
      text: 'text-base font-medium',
      gap: 'gap-2'
    }
  };

  // Enhanced variant styles with better animations and more pronounced yellow
  const variantStyles = {
    default: {
      base: 'rounded-full border border-transparent transition-all duration-300 ease-out relative overflow-hidden',
      favorited: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200 border-yellow-300 shadow-sm',
      unfavorited: 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 hover:border-yellow-200',
      loading: 'text-gray-300 cursor-not-allowed bg-gray-50'
    },
    minimal: {
      base: 'rounded transition-all duration-300 ease-out',
      favorited: 'text-yellow-600 hover:text-yellow-700',
      unfavorited: 'text-gray-400 hover:text-yellow-500',
      loading: 'text-gray-300 cursor-not-allowed'
    },
    outlined: {
      base: 'rounded-full border-2 transition-all duration-300 ease-out',
      favorited: 'text-yellow-600 border-yellow-600 bg-yellow-50 hover:bg-yellow-100',
      unfavorited: 'text-gray-400 border-gray-300 hover:text-yellow-500 hover:border-yellow-500',
      loading: 'text-gray-300 border-gray-200 cursor-not-allowed'
    },
    ghost: {
      base: 'rounded-lg transition-all duration-300 ease-out hover:bg-opacity-10',
      favorited: 'text-yellow-600 hover:bg-yellow-500',
      unfavorited: 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500',
      loading: 'text-gray-300 cursor-not-allowed'
    },
    pill: {
      base: 'rounded-full px-3 py-1 transition-all duration-300 ease-out',
      favorited: 'text-yellow-700 bg-yellow-200 hover:bg-yellow-300',
      unfavorited: 'text-gray-600 bg-gray-100 hover:bg-yellow-100 hover:text-yellow-600',
      loading: 'text-gray-400 bg-gray-100 cursor-not-allowed'
    }
  };

  // Animation classes
  const animationClasses = {
    bounce: 'animate-[bounce_0.6s_ease-in-out]',
    pulse: 'animate-[pulse_0.6s_ease-in-out]',
    scale: 'hover:scale-110 active:scale-95 transform-gpu',
    none: ''
  };

  const config = sizeConfig[size];
  const styles = variantStyles[variant];
  const isButtonLoading = contextLoading || isProcessing;

  // Debounced click handler to prevent rapid clicking
  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isButtonLoading || disabled) return;
    
    // Increment click count for testing
    clickCountRef.current += 1;
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Redirect to login if not authenticated
    if (!session) {
      const currentPath = router.asPath;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Validate blog ID
    if (!blogId || blogId === 'undefined' || blogId === '') {
      console.error('Invalid blog ID for favorites:', blogId);
      return;
    }

    // Optimistic update
    const newState = !isFavorited;
    setOptimisticState(newState);
    setIsProcessing(true);
    setAnimationKey(prev => prev + 1);
    
    // Debounced actual API call
    debounceRef.current = setTimeout(async () => {
      try {
        await toggleFavorite(blogId);
        
        // Call the callback after successful toggle
        if (onToggleFavorite) {
          onToggleFavorite();
        }
        
        // Reset optimistic state after successful API call
        setOptimisticState(null);
      } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert optimistic update on error
        setOptimisticState(!newState);
        
        // Show error feedback (you can replace with toast)
        if (typeof window !== 'undefined') {
          console.warn('Failed to update favorite. Please try again.');
        }
      } finally {
        setIsProcessing(false);
      }
    }, 300); // 300ms debounce
  }, [isButtonLoading, disabled, session, blogId, toggleFavorite, onToggleFavorite, router, isFavorited]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const getButtonClasses = useCallback(() => {
    let classes = `${config.button} ${styles.base} ${animationClasses[animation]}`;
    
    if (isButtonLoading) {
      classes += ` ${styles.loading}`;
    } else if (isFavorited) {
      classes += ` ${styles.favorited}`;
    } else {
      classes += ` ${styles.unfavorited}`;
    }
    
    // Focus styles with more prominent yellow ring
    classes += ` focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-60 focus:ring-offset-2`;
    
    // Disabled styles
    if (disabled) {
      classes += ` opacity-50 cursor-not-allowed`;
    }
    
    if (className) {
      classes += ` ${className}`;
    }
    
    return classes;
  }, [config, styles, animation, isButtonLoading, isFavorited, disabled, className, animationClasses]);

  const getButtonTitle = useCallback(() => {
    if (disabled) return 'Favorites disabled';
    if (isButtonLoading) return 'Processing...';
    if (!session) return 'Login to add favorites';
    return isFavorited ? 'Remove from favorites' : 'Add to favorites';
  }, [disabled, isButtonLoading, session, isFavorited]);

  const getButtonText = useCallback(() => {
    if (isButtonLoading) return 'Processing...';
    if (showCount && favoriteCount > 0) {
      return isFavorited ? `Favorited (${favoriteCount})` : `Favorite (${favoriteCount})`;
    }
    return isFavorited ? 'Favorited' : 'Favorite';
  }, [isButtonLoading, isFavorited, showCount, favoriteCount]);

  const renderIcon = useCallback(() => {
    // Custom icon takes precedence
    if (customIcon) {
      return <span className={config.icon}>{customIcon}</span>;
    }

    // Loading spinner
    if (isButtonLoading) {
      return (
        <svg 
          className={`${config.icon} animate-spin`} 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    // Heart icon with animation
    return (
      <svg 
        key={animationKey} // Force re-render for animation
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={isFavorited ? "currentColor" : "none"} 
        stroke="currentColor" 
        className={`${config.icon} transition-all duration-300 ${
          isFavorited && animation !== 'none' ? animationClasses[animation] : ''
        }`}
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={isFavorited ? "0" : "1.5"} 
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" 
        />
      </svg>
    );
  }, [config.icon, isButtonLoading, isFavorited, customIcon, animationKey, animation, animationClasses]);

  return (
    <button
      onClick={handleFavoriteClick}
      disabled={isButtonLoading || disabled}
      className={getButtonClasses()}
      aria-label={getButtonTitle()}
      title={showTooltip ? getButtonTitle() : undefined}
      type="button"
      data-testid={testId}
      data-blog-id={blogId}
      data-favorited={isFavorited}
      data-click-count={clickCountRef.current}
    >
      <div className={`flex items-center ${config.gap}`}>
        {renderIcon()}
        
        {showText && (
          <span className={`${config.text} whitespace-nowrap`}>
            {getButtonText()}
          </span>
        )}
      </div>
      
      {/* Ripple effect for better UX */}
      {variant === 'default' && (
        <span className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-150 pointer-events-none" />
      )}
    </button>
  );
});

FavoriteButtonV2.displayName = 'FavoriteButtonV2';

export default FavoriteButtonV2;
