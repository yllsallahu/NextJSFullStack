import { ObjectId, Document, WithId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

interface Comment {
  _id: ObjectId;
  content: string;
  author: string;
  createdAt: Date;
  authorName?: string; // Optional here, will be populated on the server
}

interface BlogDocument {
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
      updatedAt: new Date()
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
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorDetails"
          }
        },
        {
          $unwind: "$authorDetails"
        },
        {
          $addFields: {
            authorName: "$authorDetails.name"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "comments.author",
            foreignField: "_id",
            as: "commentAuthors"
          }
        },
        {
          $addFields: {
            comments: {
              $map: {
                input: "$comments",
                as: "comment",
                in: {
                  $mergeObjects: [
                    "$$comment",
                    {
                      authorName: {
                        $let: {
                          vars: {
                            author: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$commentAuthors",
                                    cond: { $eq: ["$$this._id", { $toObjectId: "$$comment.author" }] }
                                  }
                                },
                                0
                              ]
                            }
                          },
                          in: "$$author.name"
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            authorDetails: 0,
            commentAuthors: 0
          }        },
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            author: 1,
            authorName: 1,
            image: 1,
            likes: 1,
            comments: 1,
            createdAt: 1,
            updatedAt: 1
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]).toArray();
    
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
    
    const [blog] = await db.collection<BlogDocument>("blogs")
      .aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorDetails"
          }
        },
        {
          $unwind: "$authorDetails"
        },
        {
          $addFields: {
            authorName: "$authorDetails.name"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "comments.author",
            foreignField: "_id",
            as: "commentAuthors"
          }
        },
        {
          $addFields: {
            comments: {
              $map: {
                input: "$comments",
                as: "comment",
                in: {
                  $mergeObjects: [
                    "$$comment",
                    {
                      authorName: {
                        $let: {
                          vars: {
                            author: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$commentAuthors",
                                    cond: { $eq: ["$$this._id", { $toObjectId: "$$comment.author" }] }
                                  }
                                },
                                0
                              ]
                            }
                          },
                          in: "$$author.name"
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            authorDetails: 0,
            commentAuthors: 0
          }
        }
      ]).toArray();
    
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
    
    // Get the author's name
    const user = await db.collection('users').findOne({ _id: new ObjectId(commentData.author) });
    
    const comment: Comment = {
      ...commentData,
      _id: new ObjectId(),
      createdAt: new Date(),
      authorName: user?.name || 'Anonymous'
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
