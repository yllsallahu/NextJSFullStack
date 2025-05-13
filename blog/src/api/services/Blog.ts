import clientPromise from "lib/mongodb";
import { Blog } from "api/models/Blog";

export async function createBlog(data: Blog) {
  const client = await clientPromise;
  const db = client.db("myapp");
  const result = await db
    .collection("blogs")
    .insertOne({ data, createdAt: new Date() });
  return result;
}

export async function getBlogs() {
  const client = await clientPromise;
  const db = client.db("myapp");
  const blogs = await db
    .collection("blogs")
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  return blogs;
}
