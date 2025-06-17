import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useFavorites } from '../../lib/contexts/FavoritesContext';

// Define your Yup schema
const collectionSchema = yup.object({
  name: yup.string().required('Collection name is required'),
  description: yup.string().nullable().transform((curr, orig) => orig === '' ? null : curr).default(null),
  isPublic: yup.boolean().default(true),
  selectedBlogs: yup.array(yup.string().required()).min(1, 'At least one blog must be selected').required('Please select at least one blog')
}).required();

// Derive the TypeScript type from the schema and ensure all fields are required
interface CollectionFormData {
  name: string;
  description: string | null;
  isPublic: boolean;
  selectedBlogs: string[];
}

interface FavoritesCollectionFormProps {
  onSuccess?: () => void;
  initialCollection?: {
    id?: string;
    name: string;
    description?: string;
    isPublic: boolean;
    blogIds: string[];
  };
  isEditing?: boolean;
}

const FavoritesCollectionForm: React.FC<FavoritesCollectionFormProps> = ({ 
  onSuccess,
  initialCollection,
  isEditing = false
}) => {
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CollectionFormData>({
    resolver: yupResolver(collectionSchema),
    defaultValues: {
      name: initialCollection?.name || '',
      description: initialCollection?.description || '',
      isPublic: initialCollection?.isPublic ?? true,
      selectedBlogs: initialCollection?.blogIds || [],
    }
  });

  // Selected blogs from the form
  const selectedBlogs = watch('selectedBlogs') || [];

  // Initialize the form with the initial collection data if provided
  useEffect(() => {
    if (initialCollection) {
      setValue('name', initialCollection.name);
      setValue('description', initialCollection.description || null);
      setValue('isPublic', initialCollection.isPublic);
      setValue('selectedBlogs', initialCollection.blogIds);
    }
  }, [initialCollection, setValue]);

  const onSubmit = async (data: CollectionFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Debug logging (will be removed in production build)
    if (process.env.NODE_ENV === 'development') {
      console.log('Form data being submitted:', data);
      console.log('Selected blogs:', data.selectedBlogs);
      console.log('Selected blogs count:', data.selectedBlogs?.length);
    }

    try {
      const response = await fetch(`/api/user/collections${isEditing && initialCollection?.id ? `/${initialCollection.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          blogIds: data.selectedBlogs
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save collection');
      }

      await response.json();
      
      setSubmitStatus({
        success: true,
        message: isEditing 
          ? 'Your collection has been updated successfully!' 
          : 'Your collection has been created successfully!',
      });
      
      if (!isEditing) {
        reset();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving collection:', error);
      setSubmitStatus({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (favoritesLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                  <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Edit Collection' : 'Create New Collection'}
      </h2>
      
      {submitStatus && (
        <div className={`mb-6 p-4 rounded-md ${submitStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <p className="flex items-center">
            {submitStatus.success ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {submitStatus.message}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Collection Name*
          </label>
          <input
            id="name"
            type="text"
            className={`block w-full px-4 py-3 text-gray-900 placeholder-gray-400 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="My Favorite Blogs"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className={`block w-full px-4 py-3 text-gray-900 placeholder-gray-400 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="A brief description of this collection..."
            {...register('description')}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="isPublic"
              type="checkbox"
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              {...register('isPublic')}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="isPublic" className="font-medium text-gray-700">Make this collection public</label>
            <p className="text-gray-500">Allow other users to see your collection</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Blogs for Collection*
          </label>
          
          {favorites.length === 0 ? (            <div className="border border-gray-200 rounded-md p-4 text-gray-500 text-center">
              You don&apos;t have any favorite blogs yet. 
              <Link href="/blogs" className="text-blue-500 hover:underline ml-1">
                Browse blogs to add some favorites!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 max-h-80 overflow-y-auto p-2">
              {favorites.filter(blog => blog.id && blog.id.trim() !== '').map((blog) => (
                <div key={blog.id} className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      id={`blog-${blog.id}`}
                      type="checkbox"
                      value={blog.id}
                      checked={selectedBlogs.includes(blog.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentSelected = watch('selectedBlogs') || [];
                        
                        if (e.target.checked) {
                          // Add to selected blogs if not already present
                          if (!currentSelected.includes(value)) {
                            setValue('selectedBlogs', [...currentSelected, value]);
                          }
                        } else {
                          // Remove from selected blogs
                          setValue('selectedBlogs', currentSelected.filter(id => id !== value));
                        }
                      }}
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor={`blog-${blog.id}`} className="font-medium text-gray-900">
                      {blog.title}
                    </label>
                    <p className="text-gray-500 truncate max-w-xs">
                      {blog.summary || blog.content?.substring(0, 100) + '...' || 'No description available'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {errors.selectedBlogs && (
            <p className="mt-2 text-sm text-red-600">{errors.selectedBlogs.message}</p>
          )}
          
          <div className="mt-2 text-sm text-gray-500">
            {selectedBlogs.length} blog{selectedBlogs.length !== 1 ? 's' : ''} selected
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting || favorites.length === 0}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEditing ? 'Update Collection' : 'Create Collection'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FavoritesCollectionForm;
