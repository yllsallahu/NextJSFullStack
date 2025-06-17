import { Blog } from "../api/models/Blog";
import { BlogDocument } from "../api/models/Blog";
import { ObjectId } from "mongodb";

/**
 * Converts any ID type to a string
 */
const normalizeId = (id: string | ObjectId | undefined): string => {
  if (!id) return '';
  return id.toString().replace(/^new ObjectId\("(.+)"\)$/, '$1');
};

/**
 * Converts a BlogDocument to a Blog interface
 */
export const convertBlogDocumentToBlog = (blogDoc: BlogDocument): Blog => {
  return {
    id: normalizeId(blogDoc._id),
    title: blogDoc.title,
    content: blogDoc.content,
    author: typeof blogDoc.author === 'string' ? blogDoc.author : normalizeId(blogDoc.author as ObjectId),
    createdAt: blogDoc.createdAt,
    updatedAt: blogDoc.updatedAt,
    tags: Array.isArray(blogDoc.tags) ? blogDoc.tags : [],
    imageUrl: blogDoc.imageUrl,
    summary: blogDoc.summary,
    isPublished: blogDoc.isPublished ?? false,
    slug: blogDoc.slug,
    views: blogDoc.views ?? 0,
    likes: Array.isArray(blogDoc.likes) ? blogDoc.likes.map(normalizeId) : [],
    comments: Array.isArray(blogDoc.comments) ? blogDoc.comments.map(comment => ({
      ...comment,
      _id: comment._id ? normalizeId(comment._id) : undefined,
      author: typeof comment.author === 'string' ? comment.author : normalizeId(comment.author as ObjectId)
    })) : []
  };
};

/**
 * Converts an array of BlogDocuments to Blog interfaces
 */
export const convertBlogDocumentsToBlog = (blogDocs: BlogDocument[]): Blog[] => {
  if (!Array.isArray(blogDocs)) return [];
  return blogDocs
    .filter(doc => doc && typeof doc === 'object')
    .map(convertBlogDocumentToBlog);
};
