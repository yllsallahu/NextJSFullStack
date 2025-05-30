    import clientPromise from 'lib/mongodb'; // Changed from { connectToDatabase }
    import { ObjectId } from 'mongodb';
    import type { Blog } from '../models/Blog';

    export async function getBlogById(id: string) {
      const client = await clientPromise; // Get the client
      const db = client.db("myapp"); // Get the database instance
      return await db.collection('blogs').findOne({ _id: new ObjectId(id) });
    }

    export async function getBlogs() {
      const client = await clientPromise; // Get the client
      const db = client.db("myapp"); // Get the database instance
      return await db.collection('blogs').find().sort({ createdAt: -1 }).toArray();
    }

    export async function createBlog(blogData: Partial<Blog>) {
      const client = await clientPromise; // Get the client
      const db = client.db("myapp"); // Get the database instance
      const blog = {
        ...blogData,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await db.collection('blogs').insertOne(blog);
      return { ...blog, _id: result.insertedId };
    }

    export async function updateBlog(id: string, updateData: Partial<Blog>) {
      const client = await clientPromise; // Get the client
      const db = client.db("myapp"); // Get the database instance
      const result = await db.collection('blogs').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );
      return result;
    }

    export async function deleteBlog(id: string) {
      const client = await clientPromise; // Get the client
      const db = client.db("myapp"); // Get the database instance
      return await db.collection('blogs').deleteOne({ _id: new ObjectId(id) });
    }

    export async function likeBlog(blogId: string, userId: string) {
      const client = await clientPromise; // Get the client
      const db = client.db("myapp"); // Get the database instance
      
      // It's better to use the db instance directly rather than calling getBlogById which creates another client connection
      const blog = await db.collection('blogs').findOne({ _id: new ObjectId(blogId) });
      
      if (!blog) {
        throw new Error('Blog not found');
      }

      const likes = blog.likes || [];
      const hasLiked = likes.includes(userId);

      const result = await db.collection('blogs').updateOne(
        { _id: new ObjectId(blogId) },
        {
          $set: { updatedAt: new Date() },
          [hasLiked ? '$pull' : '$addToSet']: { likes: userId }
        }
      );

      return result;
    }