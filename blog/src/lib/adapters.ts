import { Blog, BlogDocument, Comment, CommentDocument } from "../api/models/Blog";
import { ObjectId } from "mongodb";

/**
 * Normalizes an ID to a string format, safely handling undefined values
 */
const normalizeId = (id: string | ObjectId | undefined | null): string => {
  if (!id) return '';
  try {
    return id.toString().replace(/^new ObjectId\("(.+)"\)$/, '$1');
  } catch (e) {
    console.error('Error normalizing ID:', e);
    return '';
  }
};

/**
 * Converts a comment from document format to frontend format, with safe type handling
 */
const convertComment = (comment: CommentDocument | null | undefined): Comment => {
  if (!comment) {
    return {
      _id: '',
      content: '',
      author: '',
      createdAt: new Date()
    };
  }
  
  return {
    _id: normalizeId(comment._id),
    content: comment.content || '',
    author: typeof comment.author === 'string' ? comment.author : normalizeId(comment.author),
    createdAt: comment.createdAt || new Date()
  };
};

/**
 * Safely checks if a value is a valid BlogDocument
 */
const isBlogDocument = (doc: any): doc is BlogDocument => {
  return doc && 
         typeof doc === 'object' && 
         doc._id !== undefined &&
         typeof doc.title === 'string' &&
         typeof doc.content === 'string';
};

/**
 * Converts a BlogDocument to a frontend Blog interface with safe type handling
 */
export const convertBlogDocumentToBlog = (blogDoc: BlogDocument | null | undefined): Blog => {
  if (!isBlogDocument(blogDoc)) {
    console.error('Invalid blog document:', blogDoc);
    return {
      id: '',
      title: '',
      content: '',
      author: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      isPublished: false,
      slug: '',
      views: 0,
      likes: [],
      comments: []
    };
  }

  try {
    const blog: Blog = {
      id: normalizeId(blogDoc._id),
      title: blogDoc.title || '',
      content: blogDoc.content || '',
      author: typeof blogDoc.author === 'string' ? blogDoc.author : normalizeId(blogDoc.author),
      createdAt: blogDoc.createdAt || new Date(),
      updatedAt: blogDoc.updatedAt || new Date(),
      tags: Array.isArray(blogDoc.tags) ? blogDoc.tags : [],
      imageUrl: blogDoc.imageUrl,
      summary: blogDoc.summary,
      isPublished: !!blogDoc.isPublished,
      slug: blogDoc.slug || normalizeId(blogDoc._id),
      views: typeof blogDoc.views === 'number' ? blogDoc.views : 0,
      likes: Array.isArray(blogDoc.likes) ? blogDoc.likes.map(normalizeId).filter(Boolean) : [],
      comments: Array.isArray(blogDoc.comments) ? blogDoc.comments.map(convertComment).filter(c => c._id !== '') : []
    };

    return blog;
  } catch (error) {
    console.error('Error converting blog document:', error);
    return {
      id: normalizeId(blogDoc._id),
      title: blogDoc.title || '',
      content: blogDoc.content || '',
      author: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      isPublished: false,
      slug: '',
      views: 0,
      likes: [],
      comments: []
    };
  }
};

/**
 * Converts an array of BlogDocuments to frontend Blog interfaces, safely handling invalid data
 */
export const convertBlogDocumentsToBlog = (blogDocs: BlogDocument[] | null | undefined): Blog[] => {
  if (!Array.isArray(blogDocs)) {
    console.warn('Invalid blog documents array:', blogDocs);
    return [];
  }
  
  return blogDocs
    .filter((doc): doc is BlogDocument => isBlogDocument(doc))
    .map(doc => {
      try {
        return convertBlogDocumentToBlog(doc);
      } catch (error) {
        console.error('Error converting blog document:', error);
        return null;
      }
    })
    .filter((blog): blog is Blog => blog !== null);
};
