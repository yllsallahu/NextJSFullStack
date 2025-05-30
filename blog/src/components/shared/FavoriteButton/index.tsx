import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface FavoriteButtonProps {
  blogId: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

const FavoriteButton = ({ blogId, isFavorited, onToggleFavorite }: FavoriteButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleFavoriteClick = async () => {
    if (isLoading) return;
    
    // Redirect to login if not authenticated
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${router.asPath}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/blogs/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blogId }),
      });

      if (response.ok) {
        onToggleFavorite();
      } else {
        const data = await response.json();
        console.error('Failed to toggle favorite:', data.error);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFavoriteClick}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isFavorited 
          ? 'text-yellow-500 hover:text-yellow-600' 
          : 'text-gray-400 hover:text-yellow-500'
      }`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={isFavorited ? "currentColor" : "none"} 
        stroke="currentColor" 
        className="w-6 h-6"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={isFavorited ? "0" : "1.5"} 
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" 
        />
      </svg>
    </button>
  );
};

export default FavoriteButton;
