import type { NextApiRequest, NextApiResponse } from "next";
import { getBlogs, createBlog } from "api/services/Blog";
import { getToken } from "next-auth/jwt";
import { getUserById } from "api/services/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const blogs = await getBlogs();
      res.status(200).json(blogs);
    } catch (error) {
      console.error("Gabim gjatë marrjes së blogeve:", error);
      res.status(500).json({ error: "Nuk mund të merren bloget." });
    }
  } 
  else if (req.method === "POST") {
    try {
      const token = await getToken({ req });
      if (!token) {
        return res.status(401).json({ error: "Jo i autentifikuar" });
      }

      const { title, content, image } = req.body;
      
      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      // Check if the user is a superuser
      const user = await getUserById(token.id as string);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }
      
      // Verify user is a superuser
      if (!user.isSuperUser) {
        return res.status(403).json({ error: "Only superusers can create blog posts" });
      }

      const blogData = {
        title,
        content,
        author: user._id.toString(), // Convert ObjectId to string
        image: image || null, // Add image field
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await createBlog(blogData);
      res.status(201).json(result);
    } catch (error) {
      console.error("Gabim gjatë krijimit të blogut:", error);
      res.status(500).json({ error: "Gabim gjatë krijimit të blogut." });
    }
  } 
  else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Metoda ${req.method} nuk lejohet.`);
  }
}

