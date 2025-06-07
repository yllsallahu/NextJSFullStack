import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import Head from 'next/head';
import { useState } from 'react';
import MainLayout from '../../src/components/MainLayout';
import FavoritesCollectionForm from '../../src/components/forms/FavoritesCollectionForm';
import Link from 'next/link';
import { Blog } from '../../src/api/models/Blog';
import { connectToDatabase } from '../../src/lib/mongodb';
import { convertBlogDocumentsToBlog } from '../../src/lib/adapters';
import { FavoritesProvider } from '../../src/lib/contexts/FavoritesContext';
import { BlogDocument } from '../../src/api/services/Blog'; // Import BlogDocument

interface Collection {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  blogIds: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CollectionsPageProps {
  collections: Collection[];
  initialFavorites: Blog[];
  initialFavoriteIds: string[];
}

export default function CollectionsPage({ 
  collections, 
  initialFavorites, 
  initialFavoriteIds 
}: CollectionsPageProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [userCollections, setUserCollections] = useState<Collection[]>(collections);
  
  const handleCreateSuccess = async () => {
    // Reload collections after creating a new one
    const response = await fetch('/api/user/collections');
    if (response.ok) {
      const data = await response.json();
      setUserCollections(data.collections);
    }
    setIsCreating(false);
  };
  
  const handleEditSuccess = async () => {
    // Reload collections after editing
    const response = await fetch('/api/user/collections');
    if (response.ok) {
      const data = await response.json();
      setUserCollections(data.collections);
    }
    setEditingCollection(null);
  };
  
  const handleDeleteCollection = async (collectionId: string) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      const response = await fetch(`/api/user/collections/${collectionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove the collection from the local state
        setUserCollections(prevCollections => 
          prevCollections.filter(collection => collection._id !== collectionId)
        );
      } else {
        alert('Failed to delete the collection. Please try again.');
      }
    }
  };
  
  return (
    <FavoritesProvider initialFavorites={initialFavorites} initialFavoriteIds={initialFavoriteIds}>
      <Head>
        <title>My Collections | Blog Platform</title>
        <meta name="description" content="Manage your favorite blog collections" />
      </Head>
      <MainLayout>
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Collections</h1>
            {!isCreating && !editingCollection && (
              <button 
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Collection
              </button>
            )}
          </div>
          
          {isCreating ? (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Create New Collection</h2>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
              <FavoritesCollectionForm onSuccess={handleCreateSuccess} />
            </div>
          ) : editingCollection ? (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Edit Collection</h2>
                <button 
                  onClick={() => setEditingCollection(null)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
              <FavoritesCollectionForm 
                onSuccess={handleEditSuccess} 
                initialCollection={{
                  id: editingCollection._id,
                  name: editingCollection.name,
                  description: editingCollection.description,
                  isPublic: editingCollection.isPublic,
                  blogIds: editingCollection.blogIds
                }}
                isEditing={true}
              />
            </div>
          ) : userCollections.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-xl font-medium text-gray-900">No collections yet</h3>
              <p className="mt-1 text-gray-500">Get started by creating a new collection to organize your favorites.</p>
              <div className="mt-6">
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Collection
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {userCollections.map((collection) => (
                <div key={collection._id} className="bg-white overflow-hidden shadow-sm rounded-lg divide-y divide-gray-200">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{collection.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${collection.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {collection.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {collection.description || 'No description provided.'}
                    </p>
                    
                    <p className="mt-3 text-sm text-gray-500">
                      <span className="font-medium">{collection.blogIds.length}</span> blog{collection.blogIds.length !== 1 ? 's' : ''}
                    </p>
                    
                    <p className="mt-1 text-xs text-gray-400">
                      Created on {new Date(collection.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                    <Link 
                      href={`/collections/${collection._id}`} 
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Collection
                    </Link>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setEditingCollection(collection)}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCollection(collection._id)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    </FavoritesProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Unified build-time detection logic
  const isBuildTime = typeof window === 'undefined' && (
    // During Vercel build process (using VERCEL_URL availability as indicator)
    process.env.VERCEL === '1' && !process.env.VERCEL_URL ||
    // During CI builds
    process.env.CI === 'true' ||
    // During npm run build without database
    (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) ||
    // Explicit build flag
    process.env.NEXT_PHASE === 'phase-production-build'
  );

  if (isBuildTime) {
    return {
      props: {
        collections: [],
        initialFavorites: [],
        initialFavoriteIds: []
      },
    };
  }

  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/collections',
        permanent: false,
      },
    };
  }

  const serializableSession = {
    ...session,
    user: {
      ...session.user,
      image: session.user.image || null,
    },
  };

  try {
    // Connect to the database using connectToDatabase helper
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
    } catch (dbError) {
      // If database connection fails during build, return empty data
      console.log('Database connection failed, likely during build:', dbError);
      return {
        props: {
          session: serializableSession,
          collections: [],
          initialFavorites: [],
          initialFavoriteIds: []
        },
      };
    }
    
    // Fetch user collections
    const collections = await db
      .collection('collections')
      .find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .toArray();
    
    // Fetch user's favorite blogs
    const favorites: BlogDocument[] = await db // Specify type for favorites
      .collection('blogs')
      .find({ favorites: session.user.id })
      .sort({ createdAt: -1 })
      .toArray() as BlogDocument[]; // Cast to BlogDocument[]
    
    const initialFavorites = convertBlogDocumentsToBlog(favorites);
    const initialFavoriteIds = initialFavorites.map(blog => blog._id || '');
    
    return {
      props: {
        session: serializableSession,
        collections: JSON.parse(JSON.stringify(collections)),
        initialFavorites: JSON.parse(JSON.stringify(initialFavorites)),
        initialFavoriteIds
      },
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    // If there's a database connection error during build, return empty data
    return {
      props: {
        session: serializableSession,
        collections: [],
        initialFavorites: [],
        initialFavoriteIds: []
      },
    };
  }
};
