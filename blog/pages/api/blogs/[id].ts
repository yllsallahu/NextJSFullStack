import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const client = await clientPromise;
  const db = client.db("myapp");

  // READ: Merr një blog sipas ID
  if (req.method === "GET") {
    const blog = await db
      .collection("blogs")
      .findOne({ _id: new ObjectId(id as string) });
    return res.status(200).json(blog);
  }

  // UPDATE: Përditëso një blog
  if (req.method === "PUT") {
    const data = req.body;
    const result = await db
      .collection("blogs")
      .updateOne(
        { _id: new ObjectId(id as string) },
        { $set: data }
      );
    return res.status(200).json({ updated: result.modifiedCount });
  }

  // DELETE: Fshij një blog
  if (req.method === "DELETE") {
    const result = await db
      .collection("blogs")
      .deleteOne({ _id: new ObjectId(id as string) });
    return res.status(200).json({ deleted: result.deletedCount });
  }

  // Metodat e tjera nuk lejohet
  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).end(`Metoda ${req.method} nuk lejohet.`);
}
