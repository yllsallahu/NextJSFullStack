// src/api/services/User.ts
import clientPromise from "lib/mongodb";
import { User } from "api/models/User";
import { ObjectId } from "mongodb";

export async function createUser(data: Omit<User, '_id'>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    // Ensure email is unique
    const existingUser = await db.collection("users").findOne({ email: data.email });
    if (existingUser) {
      throw new Error("Email është i regjistruar tashmë");
    }
    
    const result = await db.collection("users").insertOne({
      ...data,
      createdAt: new Date()
    });
    
    return result;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}

export async function getUser(email: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const user = await db.collection("users").findOne({ email });
    return user;
  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(id) 
    });
    
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
}
