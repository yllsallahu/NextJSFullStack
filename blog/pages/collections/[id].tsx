import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import Head from 'next/head';
import { BlogDocument } from '@/api/services/Blog';
import { useState } from 'react';
import MainLayout from '../../src/components/MainLayout';
import { Blog } from '../../src/api/models/Blog';
import BlogCard from '../../src/components/shared/BlogCard';
import { connectToDatabase } from '../../src/lib/mongodb';
import { ObjectId } from 'mongodb';
import { convertBlogDocumentsToBlog } from '../../src/lib/adapters';
import { FavoritesProvider } from '../../src/lib/contexts/FavoritesContext';
import Link from 'next/link';

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

interface CollectionPageProps {
  collection: Collection;
  blogs: Blog[];
  initialFavorites: Blog[];
  initialFavoriteIds: string[];
  isOwner: boolean;
}

export default function CollectionPage({
  collection,
  blogs,
  initialFavorites,
  initialFavoriteIds,
  isOwner
}: CollectionPageProps) {
  return (
    <FavoritesProvider initialFavorites={initialFavorites} initialFavoriteIds={initialFavoriteIds}>
      <Head>
        <title>{collection.name} | Blog Platform</title>
        <meta name="description" content={collection.description || `View the ${collection.name} collection`} />
      </Head>
      <MainLayout>
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            {isOwner && (
              <Link 
                href="/collections"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to My Collections
              </Link>
            )}
            
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${collection.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {collection.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            
            {collection.description && (
              <p className="mt-2 text-lg text-gray-500">{collection.description}</p>
            )}
            
            {isOwner && (
              <div className="mt-6 flex gap-4">
                <Link
                  href={`/collections/edit/${collection._id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Collection
                </Link>
              </div>
            )}
          </div>

          {blogs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-xl font-medium text-gray-900">No blogs in this collection</h3>
              <p className="mt-1 text-gray-500">
                {isOwner ? 'Try adding some blogs to this collection.' : 'This collection is currently empty.'}
              </p>
              {isOwner && (
                <div className="mt-6">
                  <Link
                    href={`/collections/edit/${collection._id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Blogs to Collection
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard 
                  key={blog._id} 
                  blog={blog}
                  showAuthor={true} 
                  showFavoriteButton={isOwner}
                />
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    </FavoritesProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const { id } = context.params || {};
  
  if (!id || typeof id !== 'string') {
    return {
      notFound: true,
    };
  }
  
  try {
    // Connect to the database
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
    } catch (dbError) {
      // If database connection fails during build, return a default response
      console.log('Database connection failed, likely during build:', dbError);
      return {
        props: {
          collection: {
            _id: id,
            name: 'Collection Unavailable',
            description: 'Database connection unavailable',
            isPublic: true,
            blogIds: [],
            userId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          blogs: [],
          initialFavorites: [],
          initialFavoriteIds: [],
          isOwner: false
        },
      };
    }
    
    let collectionId: ObjectId;
    try {
      collectionId = new ObjectId(id);
    } catch (error) {
      return { notFound: true };
    }
    
    // Fetch the collection
    const collection = await db
      .collection('collections')
      .findOne({ _id: collectionId });
    
    if (!collection) {
      return { notFound: true };
    }
    
    // Check if the user can access this collection
    const isOwner = session?.user?.id === collection.userId;
    if (!collection.isPublic && !isOwner) {
      // If the collection is private and the user is not the owner, redirect to home
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    
    // Convert blog IDs to ObjectIds for the query
    const blogObjectIds = collection.blogIds.map((blogId: string) => {
      try {
        return new ObjectId(blogId);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
    
    // Fetch blogs in the collection
    const blogs = await db
      .collection('blogs')
      .find({ _id: { $in: blogObjectIds } })
      .toArray() as BlogDocument[];
    
    // Fetch user's favorite blogs if logged in
    let favorites: BlogDocument[] = [];
    if (session?.user?.id) {
      favorites = await db
        .collection('blogs')
        .find({ favorites: session.user.id })
        .toArray() as BlogDocument[];
    }
    
    const initialFavorites = convertBlogDocumentsToBlog(favorites);
    const initialFavoriteIds = initialFavorites.map(blog => blog._id || '');
      return {
      props: {
        collection: JSON.parse(JSON.stringify(collection)),
        blogs: JSON.parse(JSON.stringify(convertBlogDocumentsToBlog(blogs))),
        initialFavorites: JSON.parse(JSON.stringify(initialFavorites)),
        initialFavoriteIds,
        isOwner
      },
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return { notFound: true };
  }
};
