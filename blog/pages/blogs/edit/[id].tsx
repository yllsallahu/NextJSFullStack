import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import Header from 'components/Header';
import Footer from 'components/Footer';
import type { Blog } from 'api/models/Blog';

export default function EditBlogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id: blogId } = router.query;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading' || !blogId) return;

    if (!session) {
      console.error("Edit page: No session found after loading, redirecting to signin.");
      router.push('/auth/signin');
      return;
    }

    // Log the session object to inspect its contents
    console.log("Edit page session object:", JSON.stringify(session, null, 2));

    const fetchBlog = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/blogs/${blogId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch blog details');
        }
        const blogData: Blog = await res.json();

        // Log details for authorization check
        console.log("Edit page auth check: blogData.author:", blogData.author, "session.user.id:", session.user.id, "session.user.isSuperUser:", session.user.isSuperUser);

        // Authorization: Check if user can edit this blog
        if (blogData.author !== session.user.id && !session.user.isSuperUser) {
          setError('You are not authorized to edit this blog. Ensure you are logged in with the correct account.');
          // Optionally redirect
          // router.push('/blogs'); 
          setIsLoading(false);
          return;
        }

        setTitle(blogData.title);
        setContent(blogData.content);
        setCurrentImageUrl(blogData.image || null);
        setPreviewUrl(blogData.image || null); // Show current image as preview initially
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [session, status, router, blogId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      setPreviewUrl(currentImageUrl); // Revert to current image on error
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image size should not exceed 10MB.');
      setPreviewUrl(currentImageUrl); // Revert to current image on error
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageFile(file);
    setError('');
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let finalImageUrl = currentImageUrl;
      
      if (imageFile) { // If a new image was selected
        finalImageUrl = await uploadImage(imageFile);
      } else if (previewUrl === null && currentImageUrl !== null) { 
        // If preview was cleared (image removed) and there was a current image
        finalImageUrl = null; 
      }


      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, image: finalImageUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update blog post');
      }

      router.push(`/blogs/${blogId}`); // Redirect to the blog detail page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!session) {
    // This case should be handled by the useEffect redirect, but as a fallback:
    return <p>Please sign in to edit this post.</p>;
  }
  
  // If there was an authorization error or other critical fetch error
  if (error && !title && !content) {
     return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <p className="text-red-500 text-xl">{error}</p>
            <Link href="/blogs" className="mt-4 text-green-600 hover:underline">
              Go back to blogs
            </Link>
          </main>
          <Footer />
        </div>
      );
  }


  return (
    <>
      <Head>
        <title>Edit Blog Post</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6 text-black">Edit Blog Post</h1>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-800 font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="image" className="block text-gray-800 font-medium mb-2">
                  Featured Image
                </label>
                <div className="flex items-center mb-2">
                  <input
                    type="file"
                    id="image"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md mr-4 transition-colors"
                    disabled={isSubmitting}
                  >
                    {previewUrl ? 'Change Image' : 'Select Image'}
                  </button>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setImageFile(null);
                        // Important: also clear the file input so a re-selection of the same file triggers onChange
                        if(fileInputRef.current) fileInputRef.current.value = ""; 
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                      disabled={isSubmitting}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
                {previewUrl && (
                  <div className="relative w-40 h-24 border rounded-md overflow-hidden">
                    <Image 
                      src={previewUrl} 
                      alt="Preview" 
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label htmlFor="content" className="block text-gray-800 font-medium mb-2">
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                  rows={10}
                  disabled={isSubmitting}
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
