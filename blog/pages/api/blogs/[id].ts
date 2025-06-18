import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getBlogById, likeBlog, deleteBlog, updateBlog } from '../../../src/api/services/Blog';
import { getUserById } from '../../../src/api/services/User';
import { convertBlogDocumentsToBlog } from '../../../src/api/utils/blogUtils';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {  const token = await getToken({ req });
  if (!token?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Get user to check superuser status
  const user = await getUserById(token.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid blog ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const blogDoc = await getBlogById(id);
        if (!blogDoc) {
          return res.status(404).json({ error: 'Blog not found' });
        }
        // Convert MongoDB document to proper Blog format
        const blog = convertBlogDocumentsToBlog([blogDoc])[0];
        return res.json(blog);

      case 'POST':
        const { action } = req.body;
        
        if (action === 'like') {          const result = await likeBlog(id, token.id as string);
          return res.json(result);
        }
        
        return res.status(400).json({ error: 'Invalid action' });

      case 'PATCH':
        const { title, content, image } = req.body;
        if (!title && !content) {
          return res.status(400).json({ error: 'Title or content is required' });
        }
        
        const blogToUpdate = await getBlogById(id);
        if (!blogToUpdate) {
          return res.status(404).json({ error: 'Blog not found' });
        }
        
        // Only allow author or superuser to update
        if (blogToUpdate.author !== token.id && !user.isSuperUser) {
          return res.status(403).json({ error: 'Not authorized - Only the author or superusers can update blogs' });
        }
        
        const updates: { title?: string; content?: string; image?: string | null; updatedAt: Date } = {
          updatedAt: new Date()
        };
        
        if (title) updates.title = title;
        if (content) updates.content = content;
        if (typeof image === 'string' || image === null) updates.image = image;
        
        const updateResult = await updateBlog(id, updates);
        return res.json(updateResult);

      case 'DELETE':
        const blogToDelete = await getBlogById(id);
        if (!blogToDelete) {
          return res.status(404).json({ error: 'Blog not found' });
        }

        // Only allow author or superuser to delete
        if (blogToDelete.author !== token.id && !user.isSuperUser) {
          return res.status(403).json({ error: 'Not authorized - Only the author or superusers can delete blogs' });
        }

        const deleteResult = await deleteBlog(id);
        return res.json(deleteResult);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
