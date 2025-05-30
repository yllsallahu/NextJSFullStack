import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '../../../../src/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user.id) {
    return res.status(401).json({ error: 'You must be signed in to manage collections' });
  }

  const { method } = req;
  
  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;
    
    switch (method) {
      case 'GET':
        // Get all collections for the user
        const collections = await db
          .collection('collections')
          .find({ userId: userId })
          .toArray();
          
        return res.status(200).json({
          success: true,
          collections
        });

      case 'POST':
        // Validate the request body
        const { name, description, isPublic, blogIds } = req.body;
        
        if (!name || !blogIds || !Array.isArray(blogIds) || blogIds.length === 0) {
          return res.status(400).json({ 
            error: 'Collection name and at least one blog are required' 
          });
        }
        
        // Create a new collection
        const result = await db.collection('collections').insertOne({
          name,
          description: description || '',
          isPublic: isPublic || false,
          blogIds,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        return res.status(201).json({
          success: true,
          collectionId: result.insertedId,
          message: 'Collection created successfully'
        });
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
    
  } catch (error) {
    console.error('Collections API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request'
    });
  }
}
