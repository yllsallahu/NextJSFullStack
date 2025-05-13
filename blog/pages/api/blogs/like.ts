import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { likeBlog } from '@/api/services/Blog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogId } = req.body;
    if (!blogId) {
      return res.status(400).json({ error: 'Blog ID is required' });
    }

    const result = await likeBlog(blogId, token.id as string);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in like endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}