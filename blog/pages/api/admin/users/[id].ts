import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import clientPromise from '../../../../src/lib/mongodb';
import { getUserById } from '../../../../src/api/services/User';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET, PUT, PATCH, and DELETE methods
  if (!['GET', 'PUT', 'PATCH', 'DELETE'].includes(req.method!)) {
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

  const { id } = req.query;
    if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

    const client = await clientPromise;
  const db = client.db('myapp');

  try {
      if (req.method === 'GET') {
        // Get user by ID
        const user = await db.collection('users').findOne(
          { _id: new ObjectId(id) },
          { projection: { password: 0 } }
        );

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(user);
      } else if (req.method === 'PUT' || req.method === 'PATCH') {
        // Update user
        const { name, email, isSuperUser } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (typeof isSuperUser === 'boolean') updateData.isSuperUser = isSuperUser;

        const result = await db.collection('users').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User updated successfully' });
      } else if (req.method === 'DELETE') {
        // Delete user - but only if they're not a superuser
        const userToDelete = await db.collection('users').findOne({ _id: new ObjectId(id) });
        
        if (!userToDelete) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        if (userToDelete.isSuperUser) {
          return res.status(403).json({ error: 'Cannot delete superuser accounts' });
        }

        const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
      }
    } catch (error) {
      console.error('Database operation error:', error);
      return res.status(500).json({ error: 'Database operation failed' });
    }
  } catch (error) {
    console.error('Error in user operation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
