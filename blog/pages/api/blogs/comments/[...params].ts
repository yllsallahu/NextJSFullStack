import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getUserById } from 'api/services/User';
import { getBlogById, deleteComment } from 'api/services/Blog';
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

  // Validate request parameters
  const { params } = req.query;
  if (!Array.isArray(params) || params.length !== 2) {
    return res.status(400).json({ error: 'Invalid parameters. Expected blogId and commentId' });
  }
  const [blogId, commentId] = params;

  // Check HTTP method
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Check if user is a superuser
    const user = await getUserById(token.id as string);
    if (!user?.isSuperUser) {
      return res.status(403).json({ error: 'Not authorized - Only superusers can delete comments' });
    }

    // Get the blog to verify it exists
    const blog = await getBlogById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Delete the comment
    try {
      await deleteComment(blogId, commentId);
      return res.status(200).json({ 
        success: true, 
        message: 'Comment deleted successfully' 
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Comment not found') {
          return res.status(404).json({ error: 'Comment not found' });
        }
      }
      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('Error in comment management:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
