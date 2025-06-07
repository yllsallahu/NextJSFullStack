import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import clientPromise from '../../../src/lib/mongodb';
import { getUserById } from '../../../src/api/services/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user is a superuser
    const user = await getUserById(token.id as string);
    if (!user?.isSuperUser) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get all users
    const client = await clientPromise();
    const db = client.db('myapp');
    
    const users = await db.collection('users')
      .find({})
      .project({ password: 0 }) // Exclude passwords
      .toArray();
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
