import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import clientPromise from '../../../../src/lib/mongodb';
import { getUserById } from '../../../../src/api/services/User';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Check if user is a superuser
  const currentUser = await getUserById(token.id as string);
  if (!currentUser?.isSuperUser) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const client = await clientPromise();
  const db = client.db('myapp');

  try {
    switch (req.method) {
      case 'DELETE':
        // Prevent self-deletion
        if (id === token.id) {
          return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const deleteResult = await db.collection('users').deleteOne({ 
          _id: new ObjectId(id)
        });

        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });

      case 'PATCH':
        const { name, email } = req.body;
        if (!name && !email) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        const updateData: { name?: string; email?: string } = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        const updateResult = await db.collection('users').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (updateResult.matchedCount === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User updated successfully' });

      default:
        res.setHeader('Allow', ['DELETE', 'PATCH']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error in user management:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
