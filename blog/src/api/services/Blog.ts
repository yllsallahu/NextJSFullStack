import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
import type { Blog, Comment } from "api/models/Blog";
import { getUserById } from "./User";

export async function createBlog(blog: Omit<Blog, '_id'>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const result = await db.collection("blogs").insertOne({
      ...blog,
      likes: [],
      comments: [],
      createdAt: new Date()
    });
    
    return result;
  } catch (error) {
    console.error('Error in createBlog:', error);
    throw error;
  }
}

export async function getBlogs() {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const blogs = await db.collection("blogs")
      .find({})
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
    
    const blog = await db.collection("blogs").findOne({ 
      _id: new ObjectId(id) 
    });
    
    return blog;
  } catch (error) {
    console.error('Error in getBlogById:', error);
    throw error;
  }
}

export async function updateBlog(id: string, updates: Partial<Blog>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const result = await db.collection("blogs").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    
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
    
    const result = await db.collection("blogs").deleteOne({
      _id: new ObjectId(id)
    });
    
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
    
    // Get current blog to check if user has already liked it
    const blog = await getBlogById(blogId);
    if (!blog) {
      throw new Error('Blog not found');
    }
    
    const likes = Array.isArray(blog.likes) ? blog.likes : [];
    const hasLiked = likes.includes(userId);
    
    // Toggle like
    const result = await db.collection("blogs").updateOne(
      { _id: new ObjectId(blogId) },
      hasLiked
        ? { $pull: { likes: userId } } as any
        : { $addToSet: { likes: userId } } as any
    );
    
    return result;
  } catch (error) {
    console.error('Error in likeBlog:', error);
    throw error;
  }
}

export async function getUserBlogs(userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const blogs = await db.collection("blogs")
      .find({ authorId: userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return blogs;
  } catch (error) {
    console.error('Error in getUserBlogs:', error);
    throw error;
  }
}

export async function addComment(blogId: string, comment: Omit<Comment, '_id'>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const commentWithId = {
      ...comment,
      _id: new ObjectId(),
      createdAt: new Date()
    };
    
    const result = await db.collection("blogs").updateOne(
      { _id: new ObjectId(blogId) },
      { 
        $push: { comments: commentWithId } as any,
        $set: { updatedAt: new Date() }
      }
    );
    
    return { result, comment: commentWithId };
  } catch (error) {
    console.error('Error in addComment:', error);
    throw error;
  }
}

export async function deleteComment(blogId: string, commentId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const result = await db.collection("blogs").updateOne(
      { _id: new ObjectId(blogId) },
      { 
        $pull: { comments: { _id: new ObjectId(commentId) } } as any,
        $set: { updatedAt: new Date() }
      }
    );
    
    return result;
  } catch (error) {
    console.error('Error in deleteComment:', error);
    throw error;
  }
}
