import { Blog } from "../api/models/Blog";
import { BlogDocument } from "../api/models/Blog";
import { ObjectId } from "mongodb";

/**
 * Converts a BlogDocument to a Blog interface
 */
export const convertBlogDocumentToBlog = (blogDoc: BlogDocument): Blog => {
  return {
    id: blogDoc._id?.toString() || '',
    title: blogDoc.title,
    content: blogDoc.content,
    author: blogDoc.author,
    createdAt: blogDoc.createdAt,
    updatedAt: blogDoc.updatedAt,
    tags: blogDoc.tags || [],
    imageUrl: blogDoc.imageUrl,
    summary: blogDoc.summary,
    isPublished: blogDoc.isPublished,
    slug: blogDoc.slug,
    views: blogDoc.views || 0,
    likes: blogDoc.likes || [],
    comments: blogDoc.comments || []
  };
};

/**
 * Converts an array of BlogDocuments to Blog interfaces
 */
export const convertBlogDocumentsToBlog = (blogDocs: BlogDocument[]): Blog[] => {
  return blogDocs.map(convertBlogDocumentToBlog);
};
