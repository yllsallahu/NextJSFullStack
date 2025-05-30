import { Blog } from "../api/models/Blog";
import { BlogDocument } from "../api/services/Blog";
import { ObjectId } from "mongodb";

/**
 * Converts a BlogDocument to a Blog interface
 */
export const convertBlogDocumentToBlog = (blogDoc: BlogDocument): Blog => {
  return {
    _id: blogDoc._id?.toString(),
    title: blogDoc.title,
    content: blogDoc.content,
    description: blogDoc.description, // Add the missing description field
    author: blogDoc.author,
    image: blogDoc.image,
    likes: blogDoc.likes,
    comments: blogDoc.comments?.map(comment => ({
      _id: comment._id.toString(),
      content: comment.content,
      author: comment.author,
      createdAt: comment.createdAt
    })) || [],
    createdAt: blogDoc.createdAt,
    updatedAt: blogDoc.updatedAt
  };
};

/**
 * Converts an array of BlogDocuments to Blog interfaces
 */
export const convertBlogDocumentsToBlog = (blogDocs: BlogDocument[]): Blog[] => {
  return blogDocs.map(blogDoc => convertBlogDocumentToBlog(blogDoc));
};
