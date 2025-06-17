import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useState } from 'react';
import MainLayout from '../src/components/MainLayout';
import FavoriteButton from '../src/components/shared/FavoriteButton';
import { FavoritesProvider } from '../src/lib/contexts/FavoritesContext';

interface FavoriteTestPageProps {
  initialFavorites: any[];
  initialFavoriteIds: string[];
}

export default function FavoriteTestPage({ initialFavorites, initialFavoriteIds }: FavoriteTestPageProps) {
  const [testBlogId] = useState('test-blog-123'); // Mock blog ID for testing
  const [actionLog, setActionLog] = useState<string[]>([]);

  const handleToggleFavorite = () => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`${timestamp}: Favorite toggled for ${testBlogId}`, ...prev.slice(0, 4)]);
  };

  return (
    <FavoritesProvider initialFavorites={initialFavorites} initialFavoriteIds={initialFavoriteIds}>
      <Head>
        <title>Favorite Button Test | Blog Platform</title>
        <meta name="description" content="Test page for the improved favorite button" />
      </Head>
      
      <MainLayout>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-center mb-8">Favorite Button Test</h1>
          
          {/* Action Log */}
          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h2 className="text-lg font-semibold mb-2">Action Log:</h2>
            {actionLog.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {actionLog.map((log, index) => (
                  <li key={index} className="text-gray-700">{log}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No actions yet. Click a favorite button to see logs.</p>
            )}
          </div>

          {/* Size Variations */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Size Variations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Small (sm)</h3>
                <div className="flex items-center space-x-4">
                  <FavoriteButton 
                    blogId={testBlogId} 
                    size="sm"
                    onToggleFavorite={handleToggleFavorite}
                  />
                  <FavoriteButton 
                    blogId={testBlogId} 
                    size="sm"
                    showText
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Medium (md) - Default</h3>
                <div className="flex items-center space-x-4">
                  <FavoriteButton 
                    blogId={testBlogId} 
                    size="md"
                    onToggleFavorite={handleToggleFavorite}
                  />
                  <FavoriteButton 
                    blogId={testBlogId} 
                    size="md"
                    showText
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Large (lg)</h3>
                <div className="flex items-center space-x-4">
                  <FavoriteButton 
                    blogId={testBlogId} 
                    size="lg"
                    onToggleFavorite={handleToggleFavorite}
                  />
                  <FavoriteButton 
                    blogId={testBlogId} 
                    size="lg"
                    showText
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Variant Styles */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Style Variants</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Default Variant</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <FavoriteButton 
                      blogId={testBlogId} 
                      variant="default"
                      onToggleFavorite={handleToggleFavorite}
                    />
                    <span className="text-sm text-gray-600">Icon only</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <FavoriteButton 
                      blogId={testBlogId} 
                      variant="default"
                      showText
                      onToggleFavorite={handleToggleFavorite}
                    />
                    <span className="text-sm text-gray-600">With text</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Minimal Variant</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <FavoriteButton 
                      blogId={testBlogId} 
                      variant="minimal"
                      onToggleFavorite={handleToggleFavorite}
                    />
                    <span className="text-sm text-gray-600">Icon only</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <FavoriteButton 
                      blogId={testBlogId} 
                      variant="minimal"
                      showText
                      onToggleFavorite={handleToggleFavorite}
                    />
                    <span className="text-sm text-gray-600">With text</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Outlined Variant</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <FavoriteButton 
                      blogId={testBlogId} 
                      variant="outlined"
                      onToggleFavorite={handleToggleFavorite}
                    />
                    <span className="text-sm text-gray-600">Icon only</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <FavoriteButton 
                      blogId={testBlogId} 
                      variant="outlined"
                      showText
                      onToggleFavorite={handleToggleFavorite}
                    />
                    <span className="text-sm text-gray-600">With text</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Usage Examples */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Usage Examples</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">In a Blog Card Context</h3>
              <div className="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded"></div>
                    <div>
                      <h4 className="font-medium">Sample Blog Title</h4>
                      <p className="text-sm text-gray-600">Sample blog content preview...</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <FavoriteButton 
                      blogId={testBlogId} 
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">In a Toolbar</h3>
              <div className="bg-gray-50 p-3 rounded border-2 border-dashed border-gray-300">
                <div className="flex items-center space-x-2">
                  <FavoriteButton 
                    blogId={testBlogId} 
                    size="sm"
                    showText
                    variant="outlined"
                    onToggleFavorite={handleToggleFavorite}
                  />
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100">
                    Share
                  </button>
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100">
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Notes */}
          <section className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-blue-900">Performance Improvements</h2>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Memoized state:</strong> Favorite status is memoized to prevent unnecessary re-renders</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>useCallback:</strong> Click handler is memoized to prevent function recreation on every render</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Event optimization:</strong> Prevents event bubbling and handles validation efficiently</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Configurable variants:</strong> Multiple size and style options without code duplication</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Better UX:</strong> Visual feedback, loading states, and accessibility improvements</span>
              </li>
            </ul>
          </section>
        </div>
      </MainLayout>
    </FavoritesProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  // Mock data for testing - in a real app this would come from your API
  const initialFavorites: any[] = [];
  const initialFavoriteIds: string[] = [];

  return {
    props: {
      initialFavorites,
      initialFavoriteIds,
    },
  };
};
