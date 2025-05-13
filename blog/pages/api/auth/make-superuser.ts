import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { makeSuperUser, getUserById } from 'api/services/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if the current user is a superuser
    const currentUser = await getUserById(token.id as string);
    if (!currentUser?.isSuperUser) {
      return res.status(403).json({ error: 'Only superusers can promote other users' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Make the target user a superuser
    await makeSuperUser(userId);

    return res.status(200).json({ message: 'User promoted to superuser successfully' });
  } catch (error) {
    console.error('Error in make-superuser:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}