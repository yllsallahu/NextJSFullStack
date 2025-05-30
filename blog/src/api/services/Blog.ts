import clientPromise from "lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";

interface Comment {
  _id: ObjectId;
  content: string;
  author: string;
  createdAt: Date;
}

export interface BlogDocument {
  description: string; // Changed from ReactNode to string
  _id?: ObjectId;
  title: string;
  content: string;
  author: string;
  image?: string | null;
  likes: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export async function createBlog(blog: Pick<BlogDocument, 'title' | 'content' | 'author' | 'image'>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const newBlog: BlogDocument = {
      ...blog,
      likes: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      description: ""
    };
    
    const result = await db.collection<BlogDocument>("blogs").insertOne(newBlog);
    return { ...newBlog, _id: result.insertedId };
  } catch (error) {
    console.error('Error in createBlog:', error);
    throw error;
  }
}

export async function getBlogs() {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const blogs = await db.collection<BlogDocument>("blogs")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    
    return blogs;
  } catch (error) {
    console.error('Error in getBlogs:', error);
    throw error;
  }
}

export async function getBlogById(id: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const blog = await db.collection<BlogDocument>("blogs")
      .findOne({ _id: new ObjectId(id) } as any);
    
    if (!blog) {
      throw new Error('Blog not found');
    }
    
    return blog;
  } catch (error) {
    console.error('Error in getBlogById:', error);
    throw error;
  }
}

export async function updateBlog(id: string, updates: Partial<Pick<BlogDocument, 'title' | 'content' | 'image'>> & { updatedAt: Date }) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const result = await db.collection<BlogDocument>("blogs").updateOne(
      { _id: new ObjectId(id) } as any,
      { 
        $set: updates
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Blog not found');
    }
    
    return result;
  } catch (error) {
    console.error('Error in updateBlog:', error);
    throw error;
  }
}

export async function deleteBlog(id: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const result = await db.collection<BlogDocument>("blogs").deleteOne(
      { _id: new ObjectId(id) } as any
    );
    
    if (result.deletedCount === 0) {
      throw new Error('Blog not found');
    }
    
    return result;
  } catch (error) {
    console.error('Error in deleteBlog:', error);
    throw error;
  }
}

export async function likeBlog(blogId: string, userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const blog = await getBlogById(blogId);
    const hasLiked = blog.likes.includes(userId);
    
    const result = await db.collection<BlogDocument>("blogs").updateOne(
      { _id: new ObjectId(blogId) } as any,
      {
        $set: { updatedAt: new Date() },
        ...(hasLiked 
          ? { $pull: { likes: userId } as any }
          : { $addToSet: { likes: userId } as any }
        )
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Blog not found');
    }
    
    const updatedBlog = await getBlogById(blogId);
    return { 
      success: true, 
      likes: updatedBlog.likes 
    };
  } catch (error) {
    console.error('Error in likeBlog:', error);
    throw error;
  }
}

export async function addComment(blogId: string, commentData: Pick<Comment, 'content' | 'author'>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const comment: Comment = {
      ...commentData,
      _id: new ObjectId(),
      createdAt: new Date()
    };
    
    const result = await db.collection<BlogDocument>("blogs").updateOne(
      { _id: new ObjectId(blogId) } as any,
      { 
        $push: { comments: comment } as any,
        $set: { updatedAt: new Date() }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Blog not found');
    }
    
    return { success: true, comment };
  } catch (error) {
    console.error('Error in addComment:', error);
    throw error;
  }
}

export async function deleteComment(blogId: string, commentId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const result = await db.collection<BlogDocument>("blogs").updateOne(
      { _id: new ObjectId(blogId) } as any,
      { 
        $pull: { comments: { _id: new ObjectId(commentId) } } as any,
        $set: { updatedAt: new Date() }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Blog not found');
    }
    
    if (result.modifiedCount === 0) {
      throw new Error('Comment not found');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteComment:', error);
    throw error;
  }
}

export async function favoriteBlogs(userId: string, blogId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    // Check if the user has already favorited this blog
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) } as any);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Initialize favorites array if it doesn't exist
    if (!user.favorites) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) } as any,
        { $set: { favorites: [] } }
      );
    }
    
    const hasFavorited = user.favorites && user.favorites.some((id: string) => id === blogId);
    
    // Toggle favorite status
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) } as any,
      hasFavorited
        ? { $pull: { favorites: blogId } as any }
        : { $addToSet: { favorites: blogId } as any }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
    
    // Get updated user to return current favorites
    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(userId) } as any);
    
    return { 
      success: true, 
      favorites: updatedUser?.favorites || [],
      isFavorited: !hasFavorited
    };
  } catch (error) {
    console.error('Error in favoriteBlogs:', error);
    throw error;
  }
}

export async function getFavoriteBlogs(userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    // Get user's favorite blog IDs
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) } as any,
      { projection: { favorites: 1 } }
    );
    
    if (!user || !user.favorites || user.favorites.length === 0) {
      return [];
    }
    
    // Get the actual blog documents
    const favoriteIds = user.favorites.map((id: string) => new ObjectId(id));
    const favoriteBlogs = await db.collection<BlogDocument>("blogs")
      .find({ _id: { $in: favoriteIds } } as any)
      .sort({ createdAt: -1 })
      .toArray();
    
    return favoriteBlogs;
  } catch (error) {
    console.error('Error in getFavoriteBlogs:', error);
    throw error;
  }
}
