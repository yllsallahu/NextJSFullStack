import { useState } from 'react';
import Head from 'next/head';
import FavoritesCollectionForm from '../src/components/forms/FavoritesCollectionForm';
import { FavoritesProvider } from '../src/lib/contexts/FavoritesContext';

// Mock favorites data for testing
const mockFavorites = [
  {
    id: '1',
    title: 'Test Blog 1',
    content: 'This is a test blog content for testing the collections form.',
    author: 'Test Author',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['test'],
    summary: 'A test blog for collections',
    isPublished: true,
    slug: 'test-blog-1',
    views: 0,
    likes: [],
    comments: []
  },
  {
    id: '2',
    title: 'Test Blog 2',
    content: 'Another test blog content for testing the collections form.',
    author: 'Test Author 2',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['test'],
    summary: 'Another test blog for collections',
    isPublished: true,
    slug: 'test-blog-2',
    views: 0,
    likes: [],
    comments: []
  },
  {
    id: '3',
    title: 'Test Blog 3',
    content: 'Yet another test blog content for testing the collections form.',
    author: 'Test Author 3',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['test'],
    isPublished: true,
    slug: 'test-blog-3',
    views: 0,
    likes: [],
    comments: []
  }
];

export default function TestCollections() {
  const [formData, setFormData] = useState<any>(null);

  const handleSuccess = () => {
    console.log('Collection creation succeeded!');
    alert('Collection created successfully!');
  };

  return (
    <FavoritesProvider initialFavorites={mockFavorites} initialFavoriteIds={mockFavorites.map(b => b.id)}>
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Test Collections Form</title>
        </Head>
        
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Test Collections Form</h1>
          
          <div className="max-w-4xl mx-auto">
            <FavoritesCollectionForm onSuccess={handleSuccess} />
          </div>
          
          {formData && (
            <div className="mt-8 p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Form Data:</h3>
              <pre className="text-sm text-gray-600">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </FavoritesProvider>
  );
}
