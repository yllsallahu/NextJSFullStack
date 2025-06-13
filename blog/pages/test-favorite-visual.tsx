import React, { useState } from 'react';

const TestFavoriteVisualPage = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Simple favorite button without complex context
  const SimpleFavoriteButton = ({ blogId, size = 'md' }: {
    blogId: string;
    size?: 'sm' | 'md' | 'lg';
  }) => {
    const isFavorited = favorites.includes(blogId);
    
    const handleClick = () => {
      setFavorites(prev => 
        prev.includes(blogId) 
          ? prev.filter(id => id !== blogId)
          : [...prev, blogId]
      );
    };

    const sizeConfig = {
      sm: { icon: 'w-3.5 h-3.5', button: 'p-1.5 min-w-[28px] h-7' },
      md: { icon: 'w-4 h-4', button: 'p-2 min-w-[32px] h-8' },
      lg: { icon: 'w-5 h-5', button: 'p-2.5 min-w-[36px] h-9' }
    };

    const config = sizeConfig[size];
    const baseClasses = "rounded-full border border-transparent transition-all duration-300 ease-out relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-60 focus:ring-offset-2";
    
    const stateClasses = isFavorited 
      ? "text-yellow-600 bg-yellow-100 hover:bg-yellow-200 border-yellow-300 shadow-sm"
      : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 hover:border-yellow-200";

    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} ${stateClasses} ${config.button}`}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill={isFavorited ? "currentColor" : "none"} 
          stroke="currentColor" 
          className={`${config.icon} transition-all duration-300`}
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Favorite Button Visual Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click the favorite buttons below</li>
            <li>They should turn yellow immediately when clicked</li>
            <li>Different sizes are shown</li>
            <li>No authentication required for this test</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Different sizes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Different Sizes</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm w-16">Small:</span>
                <SimpleFavoriteButton blogId="test-1" size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-16">Medium:</span>
                <SimpleFavoriteButton blogId="test-2" size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-16">Large:</span>
                <SimpleFavoriteButton blogId="test-3" size="lg" />
              </div>
            </div>
          </div>

          {/* Multiple buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Multiple Buttons</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm w-16">Button 1:</span>
                <SimpleFavoriteButton blogId="test-4" size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-16">Button 2:</span>
                <SimpleFavoriteButton blogId="test-5" size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-16">Button 3:</span>
                <SimpleFavoriteButton blogId="test-6" size="md" />
              </div>
            </div>
          </div>

          {/* Status display */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Current Favorites</h3>
            <div className="text-sm text-gray-600">
              {favorites.length > 0 ? (
                <div>
                  <p className="mb-2">Favorited items:</p>
                  <ul className="list-disc list-inside">
                    {favorites.map((id: string) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No favorites yet. Click the buttons above!</p>
              )}
            </div>
          </div>

          {/* Visual States */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-medium mb-4">Visual State Test</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="text-center">
                <SimpleFavoriteButton blogId="unfavorited" size="md" />
                <p className="text-xs text-gray-500 mt-1">Unfavorited</p>
              </div>
              <div className="text-center">
                <SimpleFavoriteButton blogId="favorited" size="md" />
                <p className="text-xs text-gray-500 mt-1">Click to favorite</p>
              </div>
              <div className="text-xs text-gray-600 max-w-md">
                <p><strong>Expected behavior:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Gray star becomes yellow when clicked</li>
                  <li>Yellow star becomes gray when clicked again</li>
                  <li>Background changes from transparent to yellow tint</li>
                  <li>Smooth transition animation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestFavoriteVisualPage;
