import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getBlogById, likeBlog, deleteBlog, updateBlog } from 'api/services/Blog';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  console.log("API /api/blogs/[id] session object:", JSON.stringify(session, null, 2)); // <-- ADD THIS LOG

  if (!session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid blog ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const blog = await getBlogById(id);
        if (!blog) {
          return res.status(404).json({ error: 'Blog not found' });
        }
        return res.json(blog);

      case 'POST':
        const { action } = req.body;
        
        if (action === 'like') {
          const result = await likeBlog(id, session.user.id as string);
          return res.json(result);
        }
        
        return res.status(400).json({ error: 'Invalid action' });

      case 'PATCH':
        const { title, content } = req.body;
        if (!title && !content) {
          return res.status(400).json({ error: 'Title or content is required' });
        }
        
        const blogToUpdate = await getBlogById(id);
        if (!blogToUpdate) {
          return res.status(404).json({ error: 'Blog not found' });
        }
        
        // Only allow author or super user to update
        if (blogToUpdate.author !== session.user.id && !session.user.isSuperUser) {
          console.log("API /api/blogs/[id] Authorization check failed: blogToUpdate.author:", blogToUpdate.author, "session.user.id:", session.user.id, "session.user.isSuperUser:", session.user.isSuperUser); // <-- ADD THIS LOG
          return res.status(403).json({ error: 'Not authorized' });
        }
        
        const updates: { title?: string; content?: string; updatedAt: Date } = {
          updatedAt: new Date()
        };
        
        if (title) updates.title = title;
        if (content) updates.content = content;
        
        const updateResult = await updateBlog(id, updates);
        return res.json(updateResult);

      case 'DELETE':
        const blogToDelete = await getBlogById(id);
        if (!blogToDelete) {
          return res.status(404).json({ error: 'Blog not found' });
        }

        // Only allow author or super user to delete
        if (blogToDelete.author !== session.user.id && !session.user.isSuperUser) {
          console.log("API /api/blogs/[id] Authorization check failed (DELETE): blogToDelete.author:", blogToDelete.author, "session.user.id:", session.user.id, "session.user.isSuperUser:", session.user.isSuperUser); // <-- ADD THIS LOG
          return res.status(403).json({ error: 'Not authorized' });
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
