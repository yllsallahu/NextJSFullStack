import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { likeBlog } from '@/api/services/Blog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { blogId } = req.body;
    const userId = session.user.id;

    if (!blogId) {
      return res.status(400).json({ message: 'Blog ID is required' });
    }

    const result = await likeBlog(blogId, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in like blog endpoint:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}