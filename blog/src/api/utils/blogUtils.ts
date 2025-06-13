import { BlogDocument } from '../models/Blog';
import { Blog } from '../models/Blog';

export function convertBlogDocumentsToBlog(docs: BlogDocument[]): Blog[] {
  return docs.map(doc => ({
    id: doc._id?.toString() || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: doc.title,
    content: doc.content,
    author: doc.author,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    tags: doc.tags || [],
    imageUrl: doc.imageUrl,
    summary: doc.summary,
    isPublished: doc.isPublished,
    slug: doc.slug,
    views: doc.views || 0,
    likes: doc.likes || [],
    comments: doc.comments || []
  }));
} 