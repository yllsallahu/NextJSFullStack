import { NextApiRequest, NextApiResponse } from 'next';
import { favoriteBlogs, getFavoriteBlogs } from '../../../src/api/services/Blog';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { convertBlogDocumentsToBlog } from '../../../src/lib/adapters';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    
    // GET request retrieves all favorite blogs
    if (req.method === 'GET') {
      const favoriteDocs = await getFavoriteBlogs(userId);
      const favorites = convertBlogDocumentsToBlog(favoriteDocs);
      return res.status(200).json({ success: true, favorites });
    }
    
    // POST request toggles favorite status of a blog
    if (req.method === 'POST') {
      const { blogId } = req.body;
      
      if (!blogId) {
        return res.status(400).json({ error: 'Blog ID is required' });
      }
      
      const result = await favoriteBlogs(userId, blogId);
      return res.status(200).json(result);
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in favorite API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
