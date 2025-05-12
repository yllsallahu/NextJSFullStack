import type { NextApiRequest, NextApiResponse } from "next";
import { getBlogs, createBlog } from "api/services/Blog";

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

  } else if (req.method === "POST") {
    try {
      const newBlog = req.body;
      const result = await createBlog(newBlog);
      res.status(201).json(result);
    } catch (error) {
      console.error("Gabim gjatë krijimit të blogut:", error);
      res.status(500).json({ error: "Gabim gjatë krijimit të blogut." });
    }

  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Metoda ${req.method} nuk lejohet.`);
  }
}

