import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { BlogDocument, CommentDocument, Comment } from '../models/Blog';
import { safeObjectId } from '../../lib/mongodb-utils';

interface UserDocument {
  _id: ObjectId;
  favorites: string[];
}

/**
 * Helper function to convert a string or ObjectId to ObjectId
 */
const toObjectId = (id: string | ObjectId): ObjectId => {
  if (id instanceof ObjectId) return id;
  return new ObjectId(id);
};

/**
 * Convert frontend comment to database comment
 */
const toCommentDocument = (comment: Partial<Comment>): CommentDocument => ({
  _id: new ObjectId(),
  content: comment.content || '',
  author: comment.author || '',
  createdAt: new Date()
});

/**
 * Convert database comment to frontend comment
 */
const toComment = (comment: CommentDocument): Comment => ({
  _id: comment._id.toString(),
  content: comment.content,
  author: typeof comment.author === 'string' ? comment.author : comment.author.toString(),
  createdAt: comment.createdAt
});

export async function createBlog(data: Partial<BlogDocument>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const doc: BlogDocument = {
      _id: new ObjectId(),
      title: data.title || '',
      content: data.content || '',
      author: data.author || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: false,
      views: 0,
      likes: [],
      comments: [],
      tags: [],
      ...data
    } as BlogDocument;

    const result = await db.collection<BlogDocument>("blogs").insertOne(doc);
    return { ...doc, _id: result.insertedId };
  } catch (error) {
    console.error('Error in createBlog:', error);
    throw error;
  }
}

export async function addComment(blogId: string, commentData: Omit<Comment, '_id'>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const blogObjectId = safeObjectId(blogId);
    if (!blogObjectId) {
      throw new Error(`Invalid blog ID: ${blogId}`);
    }

    const commentDoc: CommentDocument = {
      _id: new ObjectId(),
      content: commentData.content,
      author: commentData.author,
      createdAt: new Date()
    };
    
    const result = await db.collection<BlogDocument>("blogs").updateOne(
      { _id: blogObjectId },
      { $push: { comments: commentDoc } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Blog not found');
    }
    
    return toComment(commentDoc);
  } catch (error) {
    console.error('Error in addComment:', error);
    throw error;
  }
}

export async function getFavoriteBlogs(userId: string): Promise<BlogDocument[]> {
  try {
    const userObjectId = safeObjectId(userId);
    if (!userObjectId) {
      throw new Error(`Invalid user ID: ${userId}`);
    }
    
    const client = await clientPromise;
    const db = client.db("myapp");
    
    // Get user's favorite blog IDs
    const user = await db.collection<UserDocument>("users").findOne({ _id: userObjectId });
    if (!user) {
      throw new Error("User not found");
    }
    
    const favoriteBlogIds = user.favorites || [];
    const validObjectIds = favoriteBlogIds
      .map((id: string) => safeObjectId(id))
      .filter((id): id is ObjectId => id !== null);
    
    // Get the actual blog documents
    const favoriteDocs = await db.collection<BlogDocument>("blogs")
      .find({ _id: { $in: validObjectIds } })
      .toArray();
    
    return favoriteDocs;
  } catch (error) {
    console.error('Error in getFavoriteBlogs:', error);
    throw error;
  }
}

export async function toggleFavoriteBlog(userId: string, blogId: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const userObjectId = safeObjectId(userId);
    const blogObjectId = safeObjectId(blogId);
    
    if (!userObjectId || !blogObjectId) {
      throw new Error('Invalid user ID or blog ID');
    }
    
    // Verify blog exists
    const blog = await db.collection<BlogDocument>("blogs").findOne({ _id: blogObjectId });
    if (!blog) {
      throw new Error('Blog not found');
    }
    
    // Get current favorites
    const user = await db.collection<UserDocument>("users").findOne({ _id: userObjectId });
    if (!user) {
      throw new Error('User not found');
    }
    
    const favorites = user.favorites || [];
    const isFavorite = favorites.some((id: string) => id === blogId.toString());
    
    // Toggle favorite status
    const result = await db.collection<UserDocument>("users").updateOne(
      { _id: userObjectId },
      {
        [isFavorite ? '$pull' : '$addToSet']: {
          favorites: blogId.toString()
        }
      } as any // Type assertion needed due to MongoDB types limitation
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Failed to update favorites');
    }
    
    return !isFavorite;
  } catch (error) {
    console.error('Error in toggleFavoriteBlog:', error);
    throw error;
  }
}

export async function likeBlog(blogId: string, userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const blogObjectId = safeObjectId(blogId);
    if (!blogObjectId) {
      throw new Error(`Invalid blog ID: ${blogId}`);
    }
    
    // Get current likes
    const blog = await db.collection<BlogDocument>("blogs").findOne({ _id: blogObjectId });
    if (!blog) {
      throw new Error('Blog not found');
    }
    
    const likes = Array.isArray(blog.likes) ? blog.likes : [];
    const hasLiked = likes.includes(userId);
    
    // Toggle like
    const result = await db.collection<BlogDocument>("blogs").updateOne(
      { _id: blogObjectId },
      hasLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Blog not found');
    }
    
    // Return updated likes status
    const updatedBlog = await db.collection<BlogDocument>("blogs").findOne({ _id: blogObjectId });
    return {
      likes: updatedBlog?.likes || [],
      isLiked: !hasLiked
    };
  } catch (error) {
    console.error('Error in likeBlog:', error);
    throw error;
  }
}

export async function getBlogs(): Promise<BlogDocument[]> {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");

    const blogs = await db.collection<BlogDocument>("blogs").find({}).toArray();
    return blogs;
  } catch (error) {
    console.error("Error in getBlogs:", error);
    throw error;
  }
}
