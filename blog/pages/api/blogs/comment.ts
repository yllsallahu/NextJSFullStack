import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt";
import { addComment, deleteComment, getBlogById } from 'api/services/Blog';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = token.id as string;

  try {
    switch (req.method) {
      case 'POST': {
        const { blogId, content } = req.body;

        if (!blogId || !content) {
          return res.status(400).json({ message: 'Blog ID and content are required' });
        }

        // Check if blog exists
        const blog = await getBlogById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        const comment = {
          content,
          author: userId
        };

        const result = await addComment(blogId, comment);
        return res.status(201).json(result);
      }

      case 'DELETE': {
        const { blogId, commentId } = req.body;

        if (!blogId || !commentId) {
          return res.status(400).json({ message: 'Blog ID and comment ID are required' });
        }

        // Check if blog exists
        const blog = await getBlogById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if comment exists and if user is the author or a superuser
        const comment = blog.comments?.find(c => c._id.toString() === commentId);
        if (!comment) {
          return res.status(404).json({ message: 'Comment not found' });
        }

        // Only the comment author or superuser can delete the comment
        if (comment.author.toString() !== userId && !token.isSuperUser) {
          return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        const result = await deleteComment(blogId, commentId);
        return res.status(200).json(result);
      }

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in comment handler:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
