import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useFavorites } from '../../../lib/contexts/FavoritesContext';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  blogId: string;
  isFavorited?: boolean; // Add isFavorited prop
  onToggleFavorite?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'outlined' | 'ghost' | 'pill';
  showText?: boolean;
}

// Performance optimizations
const FavoriteButtonV2 = React.memo(({ 
  blogId, 
  isFavorited = false, // Default to false
  onToggleFavorite, 
  disabled = false,
  size = 'md',
  variant = 'default',
  showText = false,
}: FavoriteButtonProps) => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { isFavorite, isLoading: contextLoading, toggleFavorite } = useFavorites();
  
  // Local state with optimistic updates
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const redirectInProgressRef = useRef(false);

  // Helper to validate and format blog ID
  const sanitizeBlogId = useCallback((id: string | undefined): string | null => {
    if (!id || id === 'undefined' || id === '') return null;
    return id.toString().replace(/^new ObjectId\("(.+)"\)$/, '$1');
  }, []);

  // Only check favorite status if user is logged in
  const favoritedState = useCallback(() => {
    if (authStatus !== 'authenticated') return false;
    const sanitizedId = sanitizeBlogId(blogId);
    if (!sanitizedId) return false;
    return optimisticState !== null ? optimisticState : isFavorite(sanitizedId);
  }, [blogId, isFavorite, optimisticState, sanitizeBlogId, authStatus]);

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
  const isButtonLoading = isProcessing; // Remove contextLoading to prevent infinite loading

  // Enhanced click handler with better auth state handling
  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Early return if button should not respond
    if (isButtonLoading || disabled || redirectInProgressRef.current) return;

    const sanitizedId = sanitizeBlogId(blogId);
    if (!sanitizedId) {
      console.error('Invalid blog ID for favorites:', blogId);
      redirectInProgressRef.current = false; // Reset redirect flag
      return;
    }

    // Handle unauthenticated state
    if (authStatus === 'loading') return;

    if (authStatus === 'unauthenticated') {
      if (redirectInProgressRef.current) return;
      redirectInProgressRef.current = true;

      const returnUrl = encodeURIComponent(router.asPath);
      router.push(`/auth/signin?callbackUrl=${returnUrl}`).then(() => {
        redirectInProgressRef.current = false;
      });
      return;
    }

    // Prevent rapid clicking
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsProcessing(true);
    setOptimisticState(!favoritedState());

    try {
      await toggleFavorite(sanitizedId);
      if (onToggleFavorite) onToggleFavorite();
      
      // Reset optimistic state after successful toggle
      debounceRef.current = setTimeout(() => {
        setOptimisticState(null);
      }, 100);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setOptimisticState(null);
      // Don't show toast error for auth loading states
      if (!(error instanceof Error && error.message?.includes('loading'))) {
        toast.error('Failed to update favorite status');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    isButtonLoading, 
    disabled, 
    blogId, 
    authStatus,
    router,
    toggleFavorite,
    onToggleFavorite,
    sanitizeBlogId,
    favoritedState
  ]);

  // Reset redirect flag when auth status changes
  useEffect(() => {
    if (authStatus === 'authenticated') {
      redirectInProgressRef.current = false;
    }
  }, [authStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const currentlyFavorited = favoritedState();
  
  const getButtonClasses = () => {
    let classes = `${config.button} ${styles.base}`;
    
    if (isButtonLoading) {
      classes += ` ${styles.loading}`;
    } else if (currentlyFavorited) {
      classes += ` ${styles.favorited}`;
    } else {
      classes += ` ${styles.unfavorited}`;
    }
    
    classes += ` focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50`;
    
    return classes;
  };

  const getButtonText = () => {
    if (isButtonLoading) return 'Loading...';
    return currentlyFavorited ? 'Favorited' : 'Favorite';
  };

  const renderIcon = () => {
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

    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={currentlyFavorited ? "currentColor" : "none"} 
        stroke="currentColor" 
        className={`${config.icon} transition-all duration-200`}
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={currentlyFavorited ? "0" : "1.5"} 
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" 
        />
      </svg>
    );
  };

  return (
    <button
      onClick={handleFavoriteClick}
      disabled={isButtonLoading || disabled}
      className={getButtonClasses()}
      aria-label={currentlyFavorited ? "Remove from favorites" : "Add to favorites"}
      title={currentlyFavorited ? "Remove from favorites" : "Add to favorites"}
      type="button"
    >
      <div className={`flex items-center ${showText ? config.gap : ''}`}>
        {renderIcon()}
        
        {showText && (
          <span className={`${config.text} font-medium`}>
            {getButtonText()}
          </span>
        )}
      </div>
    </button>
  );
});

FavoriteButtonV2.displayName = 'FavoriteButtonV2';

export default FavoriteButtonV2;
