import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function CreateBlogForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');

      setPreviewUrl(null); // Clear preview if invalid file
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
      return;
    }

    // Check file size (limit to 10MB to match server-side)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should not exceed 10MB');
      setPreviewUrl(null); // Clear preview if file too large
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
      return;
    }

    setImageFile(file);
    setError(''); // Clear previous errors
    
    // Create a preview URL for the image
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to server and get URL
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      // This error will be caught by handleSubmit and set in the UI
      throw error; 
    }
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
      let uploadedImageUrl = null;
      
      // Upload image if selected
      if (imageFile) {
        uploadedImageUrl = await uploadImage(imageFile);
      }

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title, 
          content,
          image: uploadedImageUrl 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create blog post');
      }

      // Redirect to the blogs page after successful creation
      router.push('/blogs');
    } catch (err) {
      console.error('Error creating blog:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div>
            <p className="text-yellow-700">
              Please sign in to create a blog post.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-black">Create New Blog Post</h2>
      
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
            placeholder="Enter blog title"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="image" className="block text-gray-800 font-medium mb-2">
            Featured Image
          </label>
          <div className="flex items-center">
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
              Select Image
            </button>
            {previewUrl && (
              <div className="relative">
                <Image 
                  src={previewUrl} 
                  alt="Preview" 
                  width={100} 
                  height={60} 
                  className="object-cover rounded-md"
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  onClick={() => {
                    setPreviewUrl(null);
                    setImageFile(null);
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
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
            placeholder="Write your blog content"
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Blog'}
          </button>
        </div>
      </form>
    </div>
  );
}
