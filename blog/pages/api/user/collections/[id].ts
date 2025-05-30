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

  // Get the collection ID from the query parameters
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid collection ID' });
  }

  let collectionId: ObjectId;
  try {
    collectionId = new ObjectId(id);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid collection ID format' });
  }

  const { method } = req;
  const userId = session.user.id;
  
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Check if the collection belongs to the user
    const collection = await db.collection('collections').findOne({
      _id: collectionId,
      userId: userId
    });
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found or you do not have permission to access it' });
    }
    
    switch (method) {
      case 'GET':
        // Return the collection details
        return res.status(200).json({
          success: true,
          collection
        });

      case 'PUT':
        // Validate the request body
        const { name, description, isPublic, blogIds } = req.body;
        
        if (!name || !blogIds || !Array.isArray(blogIds) || blogIds.length === 0) {
          return res.status(400).json({ 
            error: 'Collection name and at least one blog are required' 
          });
        }
        
        // Update the collection
        await db.collection('collections').updateOne(
          { _id: collectionId },
          {
            $set: {
              name,
              description: description || '',
              isPublic: isPublic || false,
              blogIds,
              updatedAt: new Date()
            }
          }
        );

        return res.status(200).json({
          success: true,
          message: 'Collection updated successfully'
        });

      case 'DELETE':
        // Delete the collection
        await db.collection('collections').deleteOne({ _id: collectionId });
        
        return res.status(200).json({
          success: true,
          message: 'Collection deleted successfully'
        });
        
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
    
  } catch (error) {
    console.error('Collection API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request'
    });
  }
}
