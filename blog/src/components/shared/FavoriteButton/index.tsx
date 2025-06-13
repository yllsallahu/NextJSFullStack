import React, { useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useFavorites } from '../../../lib/contexts/FavoritesContext';

interface FavoriteButtonProps {
  blogId: string;
  onToggleFavorite?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'default' | 'minimal' | 'outlined';
}

const FavoriteButton = ({ 
  blogId, 
  onToggleFavorite, 
  size = 'md',
  showText = false,
  className = '',
  variant = 'default'
}: FavoriteButtonProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { isFavorite, isLoading: contextLoading, toggleFavorite } = useFavorites();
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoize favorite status for better performance
  const isFavorited = useMemo(() => {
    if (!blogId || blogId === 'undefined' || blogId === '') return false;
    return isFavorite(blogId);
  }, [blogId, isFavorite]);

  // Size configurations
  const sizeConfig = {
    sm: { icon: 'w-4 h-4', button: 'p-1.5', text: 'text-xs' },
    md: { icon: 'w-5 h-5', button: 'p-2', text: 'text-sm' },
    lg: { icon: 'w-6 h-6', button: 'p-3', text: 'text-base' }
  };

  // Variant styles
  const variantStyles = {
    default: {
      base: 'rounded-full transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95',
      favorited: 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 hover:bg-yellow-100',
      unfavorited: 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50',
      loading: 'text-gray-300 cursor-not-allowed'
    },
    minimal: {
      base: 'rounded transition-colors duration-200',
      favorited: 'text-yellow-500 hover:text-yellow-600',
      unfavorited: 'text-gray-400 hover:text-yellow-500',
      loading: 'text-gray-300 cursor-not-allowed'
    },
    outlined: {
      base: 'rounded-full border-2 transition-all duration-200 hover:scale-105',
      favorited: 'text-yellow-500 border-yellow-500 bg-yellow-50 hover:bg-yellow-100',
      unfavorited: 'text-gray-400 border-gray-300 hover:text-yellow-500 hover:border-yellow-500',
      loading: 'text-gray-300 border-gray-200 cursor-not-allowed'
    }
  };

  const config = sizeConfig[size];
  const styles = variantStyles[variant];
  const isButtonLoading = contextLoading || isProcessing;

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    if (isButtonLoading) return;
    
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

    setIsProcessing(true);
    
    try {
      await toggleFavorite(blogId);
      
      // Call the callback after successful toggle
      if (onToggleFavorite) {
        onToggleFavorite();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Optionally show a toast notification here
    } finally {
      setIsProcessing(false);
    }
  }, [isButtonLoading, session, blogId, toggleFavorite, onToggleFavorite, router]);

  const getButtonClasses = () => {
    let classes = `${config.button} ${styles.base}`;
    
    if (isButtonLoading) {
      classes += ` ${styles.loading}`;
    } else if (isFavorited) {
      classes += ` ${styles.favorited}`;
    } else {
      classes += ` ${styles.unfavorited}`;
    }
    
    classes += ` focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50`;
    
    if (className) {
      classes += ` ${className}`;
    }
    
    return classes;
  };

  const getButtonTitle = () => {
    if (isButtonLoading) return 'Loading...';
    if (!session) return 'Login to add favorites';
    return isFavorited ? 'Remove from favorites' : 'Add to favorites';
  };

  const getButtonText = () => {
    if (isButtonLoading) return 'Loading...';
    return isFavorited ? 'Favorited' : 'Favorite';
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
        fill={isFavorited ? "currentColor" : "none"} 
        stroke="currentColor" 
        className={`${config.icon} transition-all duration-200`}
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
  };

  return (
    <button
      onClick={handleFavoriteClick}
      disabled={isButtonLoading}
      className={getButtonClasses()}
      aria-label={getButtonTitle()}
      title={getButtonTitle()}
      type="button"
    >
      <div className="flex items-center space-x-1.5">
        {renderIcon()}
        
        {showText && (
          <span className={`${config.text} font-medium`}>
            {getButtonText()}
          </span>
        )}
      </div>
    </button>
  );
};

export default FavoriteButton;
