import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getFavoriteBlogs, toggleFavoriteBlog } from "../../../src/api/services/Blog";
import { convertBlogDocumentsToBlog } from "../../../src/api/utils/blogUtils";
import { BlogDocument } from "../../../src/api/models/Blog";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = session.user.id;

  try {
    if (req.method === 'GET') {
      const favoriteDocs = await getFavoriteBlogs(userId) as BlogDocument[];
      const favorites = convertBlogDocumentsToBlog(favoriteDocs);
      return res.status(200).json({ success: true, favorites });
    }
    
    if (req.method === 'POST') {
      const { blogId } = req.body;
      
      if (!blogId) {
        return res.status(400).json({ error: "Blog ID is required" });
      }
      
      const result = await toggleFavoriteBlog(userId, blogId);
      return res.status(200).json({ success: true, result });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in favorite API:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
